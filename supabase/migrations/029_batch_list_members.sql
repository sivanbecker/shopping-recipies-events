-- Batch RPC that returns every list member (owner + invited) across all lists
-- the caller can access (owned + shared via list_members). Used by ListsPage to
-- avoid the N+1 of one get_list_members call per card.

create or replace function public.get_all_list_members_for_user()
returns table (
  id uuid,
  list_id uuid,
  user_id uuid,
  role text,
  display_name text,
  avatar_url text
)
language sql
security definer
stable
as $$
  with accessible_lists as (
    select sl.id, sl.owner_id
    from public.shopping_lists sl
    where sl.owner_id = auth.uid()
       or exists (
         select 1 from public.list_members lm
         where lm.list_id = sl.id and lm.user_id = auth.uid()
       )
  )
  -- Owners
  select
    null::uuid as id,
    al.id as list_id,
    al.owner_id as user_id,
    'owner'::text as role,
    p.display_name,
    p.avatar_url
  from accessible_lists al
  left join public.profiles p on p.user_id = al.owner_id

  union all

  -- Invited members
  select lm.id, lm.list_id, lm.user_id, lm.role, p.display_name, p.avatar_url
  from public.list_members lm
  join accessible_lists al on al.id = lm.list_id
  left join public.profiles p on p.user_id = lm.user_id
$$;

grant execute on function public.get_all_list_members_for_user() to authenticated;
