-- =====================================================
-- Migration 004: Fix infinite recursion in RLS policies
--
-- Problem: shopping_lists SELECT policy queries list_members,
-- and list_members SELECT/ALL policies query shopping_lists —
-- creating a cycle that Postgres detects as infinite recursion.
--
-- Fix: Introduce security-definer helper functions that bypass
-- RLS when doing cross-table membership/ownership checks,
-- breaking the cycle.
-- =====================================================

-- ─── Helper functions (security definer = bypass RLS) ────────────────────────

create or replace function public.is_list_owner(p_list_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.shopping_lists
    where id = p_list_id and owner_id = auth.uid()
  )
$$;

create or replace function public.is_list_member(p_list_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.list_members
    where list_id = p_list_id and user_id = auth.uid()
  )
$$;

-- ─── Fix shopping_lists SELECT policy ────────────────────────────────────────

drop policy if exists "List owner and members can read lists" on public.shopping_lists;

create policy "List owner and members can read lists"
  on public.shopping_lists for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_list_member(id)
  );

-- ─── Fix list_members policies ────────────────────────────────────────────────

drop policy if exists "Members can read list memberships" on public.list_members;
drop policy if exists "Owner can manage memberships" on public.list_members;

create policy "Members can read list memberships"
  on public.list_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_list_owner(list_id)
  );

create policy "Owner can manage memberships"
  on public.list_members for all
  to authenticated
  using (public.is_list_owner(list_id));

-- ─── Fix shopping_items policies ─────────────────────────────────────────────

drop policy if exists "List members can read items" on public.shopping_items;
drop policy if exists "List members can insert items" on public.shopping_items;
drop policy if exists "List members can update items" on public.shopping_items;
drop policy if exists "List members can delete items" on public.shopping_items;

create policy "List members can read items"
  on public.shopping_items for select
  to authenticated
  using (public.is_list_owner(list_id) or public.is_list_member(list_id));

create policy "List members can insert items"
  on public.shopping_items for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and (public.is_list_owner(list_id) or public.is_list_member(list_id))
  );

create policy "List members can update items"
  on public.shopping_items for update
  to authenticated
  using (public.is_list_owner(list_id) or public.is_list_member(list_id));

create policy "List members can delete items"
  on public.shopping_items for delete
  to authenticated
  using (public.is_list_owner(list_id) or public.is_list_member(list_id));
