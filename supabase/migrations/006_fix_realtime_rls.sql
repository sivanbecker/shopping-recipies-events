-- =====================================================
-- Migration 006: Fix Realtime row visibility for shopping_items
--
-- Problem: Supabase Realtime (walrus) evaluates the SELECT RLS policy to
-- decide whether to forward a change event to a subscriber. Our SELECT policy
-- calls security-definer helpers (is_list_owner / is_list_member). Inside the
-- walrus context, auth.uid() is not available to security-definer functions,
-- so the membership check always returns false — Account B (an invited member)
-- never receives INSERT/UPDATE/DELETE events for items it should see.
--
-- Fix: Rewrite the shopping_items SELECT policy with direct subqueries instead
-- of the helper functions. This exposes auth.uid() in the walrus context
-- without recursion:
--   - Owner branch: queries shopping_lists WHERE owner_id = auth.uid()
--     → shopping_lists SELECT policy short-circuits on owner_id = auth.uid()
--   - Member branch: queries list_members WHERE user_id = auth.uid()
--     → list_members SELECT policy short-circuits on user_id = auth.uid()
-- No cycle, no security-definer, Realtime can evaluate it correctly.
--
-- The other shopping_items policies (INSERT/UPDATE/DELETE) are only evaluated
-- for write operations and are not involved in Realtime visibility — leave them.
-- =====================================================

drop policy if exists "List members can read items" on public.shopping_items;

create policy "List members can read items"
  on public.shopping_items for select
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists
      where id = shopping_items.list_id
        and owner_id = auth.uid()
    )
    or exists (
      select 1 from public.list_members
      where list_id = shopping_items.list_id
        and user_id = auth.uid()
    )
  );
