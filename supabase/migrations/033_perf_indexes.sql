-- Performance indexes for Stage 10.4

-- Composite index for ListDetailPage items query (list_id + is_checked + sort_order)
create index if not exists shopping_items_list_checked_idx
  on public.shopping_items (list_id, is_checked, sort_order, created_at);

-- Product lookup on items (used in AddItemSheet existingItem check)
create index if not exists shopping_items_product_idx
  on public.shopping_items (product_id);

-- Partial index for active (non-deleted) lists query
create index if not exists shopping_lists_active_idx
  on public.shopping_lists (owner_id, is_archived, created_at)
  where deleted_at is null;
