-- Function to look up a user by email address.
-- Uses SECURITY DEFINER so it can query auth.users, which is otherwise
-- inaccessible to the anon/authenticated role via the public API key.
create or replace function public.find_user_by_email(p_email text)
returns table (user_id uuid, display_name text)
language sql
security definer
stable
as $$
  select u.id, p.display_name
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where u.email = lower(trim(p_email))
  limit 1
$$;

-- Function to fetch list members (excluding owner) joined with their profiles.
-- list_members.user_id references auth.users, not profiles directly, so
-- Supabase's nested select can't resolve this — use an explicit join instead.
create or replace function public.get_list_members(p_list_id uuid)
returns table (id uuid, list_id uuid, user_id uuid, role text, display_name text)
language sql
security definer
stable
as $$
  select lm.id, lm.list_id, lm.user_id, lm.role, p.display_name
  from public.list_members lm
  left join public.profiles p on p.user_id = lm.user_id
  where lm.list_id = p_list_id
    and lm.role <> 'owner'
$$;
