-- Add avatar_url column to profiles (stores Google profile picture URL)
alter table public.profiles
  add column if not exists avatar_url text;

-- Update handle_new_user trigger to also capture avatar_url from OAuth metadata
-- (Supabase normalises Google's `picture` field to `avatar_url` in raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Update get_list_members RPC to include avatar_url so AvatarStack and ShareListDialog
-- can display real profile photos for all members.
-- Must drop first because PostgreSQL does not allow OR REPLACE to change the return type.
drop function if exists public.get_list_members(uuid);

create function public.get_list_members(p_list_id uuid)
returns table (id uuid, list_id uuid, user_id uuid, role text, display_name text, avatar_url text)
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
    p.display_name,
    p.avatar_url
  from public.shopping_lists sl
  left join public.profiles p on p.user_id = sl.owner_id
  where sl.id = p_list_id

  union all

  -- Invited members from list_members
  select lm.id, lm.list_id, lm.user_id, lm.role, p.display_name, p.avatar_url
  from public.list_members lm
  left join public.profiles p on p.user_id = lm.user_id
  where lm.list_id = p_list_id
$$;
