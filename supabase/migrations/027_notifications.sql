-- =====================================================
-- Migration 027: Notifications + server-side fan-out triggers
--
-- Adds:
--   • notifications table with per-recipient RLS.
--   • notify_list_recipients() helper: owner + members, excluding the actor.
--   • AFTER triggers on shopping_items / shopping_lists / list_members that
--     write notification rows for item_added, item_completed, item_uncompleted,
--     item_quantity_changed, list_renamed, list_deleted, list_restored,
--     member_added, member_removed, member_left, role_changed.
--   • purge_trashed_lists() RPC + (conditional) pg_cron schedule to hard-delete
--     soft-deleted lists older than 30 days.
--
-- Schema additions in 026 (last_edited_by/at, completed_by/at, deleted_at/by)
-- are prerequisites.
-- =====================================================

-- ─── 1. notifications table ──────────────────────────────────────────────────

create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  recipient_user_id   uuid not null references auth.users(id) on delete cascade,
  actor_user_id       uuid references auth.users(id) on delete set null,
  list_id             uuid references public.shopping_lists(id) on delete cascade,
  entity_type         text not null check (entity_type in ('shopping_item','shopping_list','list_member')),
  entity_id           uuid,
  notification_type   text not null check (notification_type in (
    'item_added',
    'item_completed',
    'item_uncompleted',
    'item_quantity_changed',
    'list_renamed',
    'list_deleted',
    'list_restored',
    'member_added',
    'member_removed',
    'role_changed',
    'member_left'
  )),
  payload             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  read_at             timestamptz
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc);

alter table public.notifications enable row level security;

-- No INSERT policy → direct client inserts are blocked. Only the SECURITY
-- DEFINER triggers below can write.

create policy "Recipient can read notifications"
  on public.notifications for select
  to authenticated
  using (recipient_user_id = auth.uid());

create policy "Recipient can mark notifications read"
  on public.notifications for update
  to authenticated
  using (recipient_user_id = auth.uid());

create policy "Recipient can delete notifications"
  on public.notifications for delete
  to authenticated
  using (recipient_user_id = auth.uid());

-- ─── 2. Fan-out helper ───────────────────────────────────────────────────────
--
-- Inserts one notification per recipient: owner + every list_members row,
-- excluding the actor. Used by every trigger below that affects a whole list.

create or replace function public.notify_list_recipients(
  p_list_id           uuid,
  p_actor_user_id     uuid,
  p_entity_type       text,
  p_entity_id         uuid,
  p_notification_type text,
  p_payload           jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_user_id, actor_user_id, list_id,
    entity_type, entity_id, notification_type, payload
  )
  select r.user_id, p_actor_user_id, p_list_id,
         p_entity_type, p_entity_id, p_notification_type, p_payload
  from (
    select owner_id as user_id from public.shopping_lists where id = p_list_id
    union
    select user_id from public.list_members where list_id = p_list_id
  ) r
  where r.user_id is distinct from p_actor_user_id;
end;
$$;

-- ─── 3. shopping_items triggers ──────────────────────────────────────────────

create or replace function public.shopping_items_notify_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_list_recipients(
    new.list_id,
    new.added_by,
    'shopping_item',
    new.id,
    'item_added',
    jsonb_build_object(
      'product_id', new.product_id,
      'quantity', new.quantity,
      'unit_id', new.unit_id
    )
  );
  return null;
end;
$$;

drop trigger if exists shopping_items_notify_insert on public.shopping_items;
create trigger shopping_items_notify_insert
  after insert on public.shopping_items
  for each row execute function public.shopping_items_notify_insert();

create or replace function public.shopping_items_notify_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(new.last_edited_by, auth.uid());
begin
  if new.is_checked is distinct from old.is_checked then
    perform public.notify_list_recipients(
      new.list_id,
      v_actor,
      'shopping_item',
      new.id,
      case when new.is_checked then 'item_completed' else 'item_uncompleted' end,
      jsonb_build_object('product_id', new.product_id)
    );
  elsif new.quantity is distinct from old.quantity then
    perform public.notify_list_recipients(
      new.list_id,
      v_actor,
      'shopping_item',
      new.id,
      'item_quantity_changed',
      jsonb_build_object(
        'product_id', new.product_id,
        'before', old.quantity,
        'after', new.quantity,
        'unit_id', new.unit_id
      )
    );
  end if;
  return null;
end;
$$;

drop trigger if exists shopping_items_notify_update on public.shopping_items;
create trigger shopping_items_notify_update
  after update on public.shopping_items
  for each row execute function public.shopping_items_notify_update();

-- ─── 4. shopping_lists triggers ──────────────────────────────────────────────

create or replace function public.shopping_lists_notify_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  -- Rename
  if new.name is distinct from old.name then
    perform public.notify_list_recipients(
      new.id,
      v_actor,
      'shopping_list',
      new.id,
      'list_renamed',
      jsonb_build_object('before', old.name, 'after', new.name)
    );
  end if;

  -- Soft delete transitions
  if old.deleted_at is null and new.deleted_at is not null then
    perform public.notify_list_recipients(
      new.id,
      coalesce(new.deleted_by, v_actor),
      'shopping_list',
      new.id,
      'list_deleted',
      jsonb_build_object('name', new.name)
    );
  elsif old.deleted_at is not null and new.deleted_at is null then
    perform public.notify_list_recipients(
      new.id,
      v_actor,
      'shopping_list',
      new.id,
      'list_restored',
      jsonb_build_object('name', new.name)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists shopping_lists_notify_update on public.shopping_lists;
create trigger shopping_lists_notify_update
  after update on public.shopping_lists
  for each row execute function public.shopping_lists_notify_update();

-- ─── 5. list_members triggers ────────────────────────────────────────────────

create or replace function public.list_members_notify_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_name text;
begin
  select name into v_list_name from public.shopping_lists where id = new.list_id;

  -- The new member receives a "you were added" notification. Actor is the
  -- list owner (only owners can insert memberships per RLS).
  insert into public.notifications (
    recipient_user_id, actor_user_id, list_id,
    entity_type, entity_id, notification_type, payload
  )
  select
    new.user_id,
    sl.owner_id,
    new.list_id,
    'list_member',
    new.id,
    'member_added',
    jsonb_build_object('role', new.role, 'list_name', v_list_name)
  from public.shopping_lists sl
  where sl.id = new.list_id
    and sl.owner_id is distinct from new.user_id;

  return null;
end;
$$;

drop trigger if exists list_members_notify_insert on public.list_members;
create trigger list_members_notify_insert
  after insert on public.list_members
  for each row execute function public.list_members_notify_insert();

create or replace function public.list_members_notify_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor    uuid := auth.uid();
  v_is_self  boolean := (v_actor = old.user_id);
  v_list_name text;
begin
  select name into v_list_name from public.shopping_lists where id = old.list_id;

  if v_is_self then
    -- Self-removal ("I left"): notify everyone else.
    perform public.notify_list_recipients(
      old.list_id,
      old.user_id,
      'list_member',
      old.id,
      'member_left',
      jsonb_build_object('user_id', old.user_id, 'list_name', v_list_name)
    );
  else
    -- Owner kicked the user out: notify the removed user directly, plus the
    -- remaining members so they can see who's still on the list.
    insert into public.notifications (
      recipient_user_id, actor_user_id, list_id,
      entity_type, entity_id, notification_type, payload
    ) values (
      old.user_id, v_actor, old.list_id,
      'list_member', old.id, 'member_removed',
      jsonb_build_object('list_name', v_list_name)
    );
    perform public.notify_list_recipients(
      old.list_id,
      v_actor,
      'list_member',
      old.id,
      'member_removed',
      jsonb_build_object('user_id', old.user_id, 'list_name', v_list_name)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists list_members_notify_delete on public.list_members;
create trigger list_members_notify_delete
  after delete on public.list_members
  for each row execute function public.list_members_notify_delete();

create or replace function public.list_members_notify_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_list_name text;
begin
  if new.role is distinct from old.role then
    select name into v_list_name from public.shopping_lists where id = new.list_id;

    insert into public.notifications (
      recipient_user_id, actor_user_id, list_id,
      entity_type, entity_id, notification_type, payload
    ) values (
      new.user_id, v_actor, new.list_id,
      'list_member', new.id, 'role_changed',
      jsonb_build_object('before', old.role, 'after', new.role, 'list_name', v_list_name)
    );
  end if;
  return null;
end;
$$;

drop trigger if exists list_members_notify_update on public.list_members;
create trigger list_members_notify_update
  after update on public.list_members
  for each row execute function public.list_members_notify_update();

-- ─── 6. Purge of trashed lists (30-day retention) ────────────────────────────
--
-- Idempotent RPC callable manually or by a scheduler. Hard-deletes any
-- shopping_lists row whose deleted_at is older than 30 days, letting CASCADE
-- clean up items and memberships.

create or replace function public.purge_trashed_lists()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with purged as (
    delete from public.shopping_lists
    where deleted_at is not null
      and deleted_at < now() - interval '30 days'
    returning 1
  )
  select count(*) into v_count from purged;
  return v_count;
end;
$$;

-- Schedule the purge daily at 03:00 if pg_cron is installed. If it isn't
-- (local dev, bare Postgres), skip silently — the RPC can still be called
-- manually or via a GitHub Actions cron job.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('purge-trashed-lists')
      where exists (select 1 from cron.job where jobname = 'purge-trashed-lists');
    perform cron.schedule(
      'purge-trashed-lists',
      '0 3 * * *',
      $cron$ select public.purge_trashed_lists(); $cron$
    );
  end if;
exception when undefined_table then
  -- cron schema not visible; treat as "not installed".
  null;
end $$;
