-- Update get_list_members RPC to include the owner of the list.
-- Previously it only returned invited members. Now it returns owner + invited members.
-- Owner is returned first, followed by invited members.

create or replace function public.get_list_members(p_list_id uuid)
returns table (id uuid, list_id uuid, user_id uuid, role text, display_name text)
language sql
security definer
stable
as $$
  -- Owner from shopping_lists
  select
    null::uuid as id,
    sl.id as list_id,
    sl.owner_id as user_id,
    'owner'::text as role,
    p.display_name
  from public.shopping_lists sl
  left join public.profiles p on p.user_id = sl.owner_id
  where sl.id = p_list_id

  union all

  -- Invited members from list_members
  select lm.id, lm.list_id, lm.user_id, lm.role, p.display_name
  from public.list_members lm
  left join public.profiles p on p.user_id = lm.user_id
  where lm.list_id = p_list_id
$$;
