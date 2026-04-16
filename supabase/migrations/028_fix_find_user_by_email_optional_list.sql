-- Migration 028: make find_user_by_email p_list_id optional
--
-- ContactsPage calls find_user_by_email without a list context (account-linking
-- for the user's own contacts). The 026 version requires p_list_id, which breaks
-- that call site. Make p_list_id DEFAULT NULL:
--   • When NULL  — skip the ownership check (contact-linking use case).
--   • When set   — enforce that the caller owns the list (sharing use case).
--
-- We must drop the old 2-arg (required) overload first because Postgres treats
-- (text, uuid) and (text, uuid DEFAULT NULL) as the same signature.

drop function if exists public.find_user_by_email(text, uuid);

create or replace function public.find_user_by_email(p_email text, p_list_id uuid DEFAULT NULL)
returns table (user_id uuid, display_name text)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_list_id is not null and not public.is_list_owner(p_list_id) then
    -- Caller provided a list they don't own — deny silently.
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
