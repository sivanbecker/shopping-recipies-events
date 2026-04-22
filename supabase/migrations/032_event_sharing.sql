-- =====================================================
-- Migration 032: Event sharing (Stage 9.2)
--
-- Goal: mirror list sharing for events.
--   • Security-definer helpers parallel to list versions:
--       is_event_owner, is_event_member, event_member_role.
--   • Restore members visibility on events SELECT (dropped in 021 to break
--     recursion) via is_event_member(), which bypasses RLS.
--   • RPCs:
--       get_event_members — owner + invited members with profile join.
--       get_all_event_members_for_user — batch version for the events list page.
--       find_user_by_email is already in place (migration 028) and does not
--       need an event-scoped variant yet; sharing uses the unscoped lookup.
--   • event_members DELETE: already allows self-removal (migration 019).
-- =====================================================

-- ─── 1. Helper functions (security definer, bypass RLS) ──────────────────────

create or replace function public.is_event_owner(p_event_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.events
    where id = p_event_id and owner_id = auth.uid()
  )
$$;

create or replace function public.is_event_member(p_event_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.event_members
    where event_id = p_event_id and user_id = auth.uid()
  )
$$;

create or replace function public.event_member_role(p_event_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.events
      where id = p_event_id and owner_id = auth.uid()
    ) then 'owner'
    else (
      select role from public.event_members
      where event_id = p_event_id and user_id = auth.uid()
      limit 1
    )
  end
$$;

grant execute on function public.is_event_owner(uuid) to authenticated;
grant execute on function public.is_event_member(uuid) to authenticated;
grant execute on function public.event_member_role(uuid) to authenticated;

-- ─── 2. events SELECT — restore member visibility without recursion ──────────

drop policy if exists "events_select" on public.events;

create policy "events_select" on public.events for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_event_member(id)
  );

-- ─── 3. RPCs: event members ──────────────────────────────────────────────────

create or replace function public.get_event_members(p_event_id uuid)
returns table (id uuid, event_id uuid, user_id uuid, role text, display_name text, avatar_url text)
language sql
security definer
stable
as $$
  -- Owner from events
  select
    null::uuid as id,
    e.id as event_id,
    e.owner_id as user_id,
    'owner'::text as role,
    p.display_name,
    p.avatar_url
  from public.events e
  left join public.profiles p on p.user_id = e.owner_id
  where e.id = p_event_id

  union all

  -- Invited members from event_members
  select em.id, em.event_id, em.user_id, em.role, p.display_name, p.avatar_url
  from public.event_members em
  left join public.profiles p on p.user_id = em.user_id
  where em.event_id = p_event_id
$$;

grant execute on function public.get_event_members(uuid) to authenticated;

create or replace function public.get_all_event_members_for_user()
returns table (
  id uuid,
  event_id uuid,
  user_id uuid,
  role text,
  display_name text,
  avatar_url text
)
language sql
security definer
stable
as $$
  with accessible_events as (
    select e.id, e.owner_id
    from public.events e
    where e.owner_id = auth.uid()
       or exists (
         select 1 from public.event_members em
         where em.event_id = e.id and em.user_id = auth.uid()
       )
  )
  -- Owners
  select
    null::uuid as id,
    ae.id as event_id,
    ae.owner_id as user_id,
    'owner'::text as role,
    p.display_name,
    p.avatar_url
  from accessible_events ae
  left join public.profiles p on p.user_id = ae.owner_id

  union all

  -- Invited members
  select em.id, em.event_id, em.user_id, em.role, p.display_name, p.avatar_url
  from public.event_members em
  join accessible_events ae on ae.id = em.event_id
  left join public.profiles p on p.user_id = em.user_id
$$;

grant execute on function public.get_all_event_members_for_user() to authenticated;
