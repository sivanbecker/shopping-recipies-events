-- =====================================================
-- Migration 026: Collaboration & permissions upgrade — schema + RLS
--
-- Adds:
--   • Attribution + updated_at on shopping_items (last_edited_by/at, completed_by/at).
--   • Soft-delete columns on shopping_lists (deleted_at, deleted_by).
--   • list_member_role() helper so policies and the UI can ask "what role?".
--   • Role-aware RLS on shopping_items (viewers are read-only).
--   • Editor-can-rename on shopping_lists via a column-level guard trigger
--     (editors may change `name`/`updated_at`; all other columns stay owner-only).
--   • shopping_lists SELECT filters out soft-deleted rows for non-owners.
--   • list_members DELETE policy fixed so members can remove themselves.
--   • find_user_by_email hardened — must pass a list_id the caller owns.
--
-- Notifications + triggers live in 027.
-- =====================================================

-- ─── 1. shopping_items: attribution + concurrency columns ────────────────────

alter table public.shopping_items
  add column if not exists updated_at      timestamptz not null default now(),
  add column if not exists last_edited_by  uuid references auth.users(id) on delete set null,
  add column if not exists last_edited_at  timestamptz,
  add column if not exists completed_by    uuid references auth.users(id) on delete set null,
  add column if not exists completed_at    timestamptz;

-- Backfill pre-existing rows so the UI has attribution to show.
update public.shopping_items
  set last_edited_by = coalesce(last_edited_by, added_by),
      last_edited_at = coalesce(last_edited_at, created_at),
      updated_at     = coalesce(updated_at, created_at)
  where last_edited_by is null or last_edited_at is null;

-- One BEFORE UPDATE trigger that stamps updated_at + last-editor +
-- completion metadata. Keeps attribution server-authoritative so the
-- client can't forge it.
create or replace function public.shopping_items_stamp_edit()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  -- Only stamp "last edited" on actual content changes, not on echoes.
  if (new.quantity is distinct from old.quantity)
     or (new.unit_id is distinct from old.unit_id)
     or (new.note is distinct from old.note)
     or (new.product_id is distinct from old.product_id)
     or (new.is_checked is distinct from old.is_checked)
     or (new.sort_order is distinct from old.sort_order)
  then
    new.last_edited_by := auth.uid();
    new.last_edited_at := now();
  end if;

  -- Completion metadata tracks is_checked transitions.
  if new.is_checked is distinct from old.is_checked then
    if new.is_checked then
      new.completed_by := auth.uid();
      new.completed_at := now();
    else
      new.completed_by := null;
      new.completed_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists shopping_items_stamp_edit on public.shopping_items;
create trigger shopping_items_stamp_edit
  before update on public.shopping_items
  for each row execute function public.shopping_items_stamp_edit();

-- ─── 2. shopping_lists: soft-delete columns ──────────────────────────────────

alter table public.shopping_lists
  add column if not exists deleted_at  timestamptz,
  add column if not exists deleted_by  uuid references auth.users(id) on delete set null;

create index if not exists shopping_lists_trash_idx
  on public.shopping_lists (owner_id, deleted_at)
  where deleted_at is not null;

-- ─── 3. list_member_role() — central role lookup ─────────────────────────────
--
-- Returns 'owner' | 'editor' | 'viewer' | null. Bypasses RLS so policies can
-- call it without triggering the recursion issues that bit migration 004.

create or replace function public.list_member_role(p_list_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.shopping_lists
      where id = p_list_id and owner_id = auth.uid()
    ) then 'owner'
    else (
      select role from public.list_members
      where list_id = p_list_id and user_id = auth.uid()
      limit 1
    )
  end
$$;

grant execute on function public.list_member_role(uuid) to authenticated;

-- ─── 4. shopping_items RLS — role-aware writes ───────────────────────────────
--
-- SELECT stays inline (not via a security-definer helper) because Realtime
-- walrus cannot call definers — see migration 006 for the backstory. We just
-- keep migration 006's policy as-is; the role check only applies to writes.

drop policy if exists "List members can insert items" on public.shopping_items;
drop policy if exists "List members can update items" on public.shopping_items;
drop policy if exists "List members can delete items" on public.shopping_items;

create policy "Editors and owners can insert items"
  on public.shopping_items for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and public.list_member_role(list_id) in ('owner','editor')
  );

create policy "Editors and owners can update items"
  on public.shopping_items for update
  to authenticated
  using (public.list_member_role(list_id) in ('owner','editor'));

create policy "Editors and owners can delete items"
  on public.shopping_items for delete
  to authenticated
  using (public.list_member_role(list_id) in ('owner','editor'));

-- ─── 5. shopping_lists UPDATE — editors can rename, column-level guard ───────
--
-- Broaden the UPDATE policy to owner + editor, then use a BEFORE UPDATE
-- trigger to stop editors from touching sharing/lifecycle columns. Postgres
-- has no native column-level RLS, so this is the standard pattern.

drop policy if exists "Owner can update lists" on public.shopping_lists;

create policy "Owner and editors can update lists"
  on public.shopping_lists for update
  to authenticated
  using (public.list_member_role(id) in ('owner','editor'));

create or replace function public.shopping_lists_column_guard()
returns trigger
language plpgsql
as $$
declare
  caller_is_owner boolean;
begin
  caller_is_owner := (old.owner_id = auth.uid());
  if caller_is_owner then
    return new;
  end if;

  -- Editor path: only `name` and `updated_at` may change.
  if (new.owner_id       is distinct from old.owner_id)
     or (new.is_active       is distinct from old.is_active)
     or (new.is_archived     is distinct from old.is_archived)
     or (new.is_missing_list is distinct from old.is_missing_list)
     or (new.deleted_at      is distinct from old.deleted_at)
     or (new.deleted_by      is distinct from old.deleted_by)
     or (new.created_at      is distinct from old.created_at)
  then
    raise exception 'only the list owner can change sharing or lifecycle fields';
  end if;

  return new;
end;
$$;

-- Name prefixed with `aa_` so it fires before `shopping_lists_updated_at`
-- (Postgres runs BEFORE triggers in alphabetical order by trigger name).
drop trigger if exists aa_shopping_lists_column_guard on public.shopping_lists;
create trigger aa_shopping_lists_column_guard
  before update on public.shopping_lists
  for each row execute function public.shopping_lists_column_guard();

-- ─── 6. shopping_lists SELECT — hide trashed lists from non-owners ───────────

drop policy if exists "List owner and members can read lists" on public.shopping_lists;

create policy "List owner and members can read lists"
  on public.shopping_lists for select
  to authenticated
  using (
    (owner_id = auth.uid())
    or (public.is_list_member(id) and deleted_at is null)
  );

-- ─── 7. list_members DELETE — allow self-removal (leave list) ────────────────
--
-- Replace the single "Owner can manage memberships" ALL policy with explicit
-- per-verb policies so a member can delete their own row.

drop policy if exists "Owner can manage memberships" on public.list_members;

create policy "Owner can add memberships"
  on public.list_members for insert
  to authenticated
  with check (public.is_list_owner(list_id));

create policy "Owner can change memberships"
  on public.list_members for update
  to authenticated
  using (public.is_list_owner(list_id));

create policy "Owner or self can remove membership"
  on public.list_members for delete
  to authenticated
  using (public.is_list_owner(list_id) or user_id = auth.uid());

-- ─── 8. find_user_by_email — require list-scope owner check ──────────────────
--
-- The old 1-arg version let any authenticated user probe any email to
-- enumerate user IDs. Drop it and replace with a 2-arg version that demands
-- the caller own the list they're inviting to. No owner, no lookup.

drop function if exists public.find_user_by_email(text);

create or replace function public.find_user_by_email(p_email text, p_list_id uuid)
returns table (user_id uuid, display_name text)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_list_owner(p_list_id) then
    -- Return nothing rather than raising: the UI treats empty as "not found",
    -- and non-owners shouldn't be calling this anyway.
    return;
  end if;

  return query
    select u.id, p.display_name
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where u.email = lower(trim(p_email))
    limit 1;
end;
$$;

grant execute on function public.find_user_by_email(text, uuid) to authenticated;
