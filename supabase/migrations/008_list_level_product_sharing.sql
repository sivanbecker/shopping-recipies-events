-- Expand product visibility to list-level sharing.
--
-- Previously: a product was visible if is_shared=true OR created_by=current_user.
-- Now: a product is also visible if the current user and the product's creator
-- share any list together (either as owner or invited member).
--
-- The /products catalog page applies an explicit frontend filter to stay as-is
-- (own + globally shared only). This policy expansion only widens visibility
-- in contexts that don't add that explicit filter — e.g. AddItemSheet.

drop policy "Users can read shared products and their own" on public.products;

create policy "Users can read shared products and their own"
  on public.products for select
  to authenticated
  using (
    -- 1. Globally shared
    is_shared = true

    -- 2. Own product
    or created_by = auth.uid()

    -- 3. Creator owns a list that the current user is an invited member of
    or exists (
      select 1
      from public.shopping_lists sl
      join public.list_members lm on lm.list_id = sl.id
      where sl.owner_id = products.created_by
        and lm.user_id = auth.uid()
    )

    -- 4. Current user owns a list that the creator is an invited member of
    or exists (
      select 1
      from public.shopping_lists sl
      join public.list_members lm on lm.list_id = sl.id
      where sl.owner_id = auth.uid()
        and lm.user_id = products.created_by
    )

    -- 5. Both are invited members of the same list (neither is the owner)
    or exists (
      select 1
      from public.list_members lm1
      join public.list_members lm2 on lm1.list_id = lm2.list_id
      where lm1.user_id = auth.uid()
        and lm2.user_id = products.created_by
    )
  );
