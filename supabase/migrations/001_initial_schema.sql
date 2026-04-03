-- =====================================================
-- Migration 001: Initial Schema
-- Run in: Supabase Dashboard → SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- PROFILES
-- =====================================================
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text,
  preferred_language text not null default 'he' check (preferred_language in ('he', 'en')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES
-- =====================================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name_he text not null,
  name_en text not null,
  icon text,
  color text,
  sort_order int not null default 0
);

alter table public.categories enable row level security;

create policy "Anyone authenticated can read categories"
  on public.categories for select
  to authenticated using (true);

-- =====================================================
-- UNIT TYPES
-- =====================================================
create table public.unit_types (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  label_he text not null,
  label_en text not null,
  type text not null check (type in ('weight', 'volume', 'count', 'cooking'))
);

alter table public.unit_types enable row level security;

create policy "Anyone authenticated can read unit types"
  on public.unit_types for select
  to authenticated using (true);

-- =====================================================
-- PRODUCTS
-- =====================================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name_he text not null,
  name_en text,
  category_id uuid references public.categories(id),
  default_unit_id uuid references public.unit_types(id),
  created_by uuid references auth.users(id) on delete cascade not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index products_created_by_idx on public.products(created_by);
create index products_category_idx on public.products(category_id);

alter table public.products enable row level security;

create policy "Users can read shared products and their own"
  on public.products for select
  to authenticated
  using (is_shared = true or created_by = auth.uid());

create policy "Users can insert products"
  on public.products for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Users can update their own products"
  on public.products for update
  to authenticated
  using (created_by = auth.uid());

create policy "Users can delete their own products"
  on public.products for delete
  to authenticated
  using (created_by = auth.uid());

-- =====================================================
-- SHOPPING LISTS
-- =====================================================
create table public.shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  name text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  is_missing_list boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_lists_owner_idx on public.shopping_lists(owner_id, is_archived);

alter table public.shopping_lists enable row level security;

-- LIST MEMBERS (for sharing)
create table public.list_members (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  unique (list_id, user_id)
);

alter table public.list_members enable row level security;

-- Shopping list RLS: owners + members can access
create policy "List owner and members can read lists"
  on public.shopping_lists for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.list_members
      where list_id = id and user_id = auth.uid()
    )
  );

create policy "Owner can insert lists"
  on public.shopping_lists for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owner can update lists"
  on public.shopping_lists for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Owner can delete lists"
  on public.shopping_lists for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "Members can read list memberships"
  on public.list_members for select
  to authenticated
  using (user_id = auth.uid() or
    exists (select 1 from public.shopping_lists where id = list_id and owner_id = auth.uid())
  );

create policy "Owner can manage memberships"
  on public.list_members for all
  to authenticated
  using (
    exists (select 1 from public.shopping_lists where id = list_id and owner_id = auth.uid())
  );

-- SHOPPING ITEMS
create table public.shopping_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  quantity decimal not null default 1,
  unit_id uuid references public.unit_types(id),
  is_checked boolean not null default false,
  added_by uuid references auth.users(id) not null,
  recipe_id uuid, -- FK to recipes added in migration 002
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index shopping_items_list_idx on public.shopping_items(list_id);

alter table public.shopping_items enable row level security;

create policy "List members can read items"
  on public.shopping_items for select
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists l
      where l.id = list_id
        and (l.owner_id = auth.uid()
          or exists (select 1 from public.list_members m where m.list_id = l.id and m.user_id = auth.uid()))
    )
  );

create policy "List members can insert items"
  on public.shopping_items for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and exists (
      select 1 from public.shopping_lists l
      where l.id = list_id
        and (l.owner_id = auth.uid()
          or exists (select 1 from public.list_members m where m.list_id = l.id and m.user_id = auth.uid()))
    )
  );

create policy "List members can update items"
  on public.shopping_items for update
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists l
      where l.id = list_id
        and (l.owner_id = auth.uid()
          or exists (select 1 from public.list_members m where m.list_id = l.id and m.user_id = auth.uid()))
    )
  );

create policy "List members can delete items"
  on public.shopping_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.shopping_lists l
      where l.id = list_id
        and (l.owner_id = auth.uid()
          or exists (select 1 from public.list_members m where m.list_id = l.id and m.user_id = auth.uid()))
    )
  );

-- Auto-update updated_at on shopping_lists
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopping_lists_updated_at
  before update on public.shopping_lists
  for each row execute procedure update_updated_at();
