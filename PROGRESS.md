# Project Progress

## Stage 0 — Scaffold — COMPLETE (committed to `main`)
Full project scaffold, all routes, AuthPage, ProfilePage (basic), DB types, migrations, CI, Vercel.

---

## Stage 1 — Authentication & User Profiles — COMPLETE (committed to `main`)

- **Forgot password flow** — AuthPage 3-view state machine: `login | register | forgot`. Calls `supabase.auth.resetPasswordForEmail`, shows success toast, returns to login.
- **ProfilePage** — inline display name edit (save/cancel + keyboard support), language toggle saves to `profiles.preferred_language` via `updateProfile`.
- **`useAuth` extended** — `updateProfile(updates)` writes to DB and updates local profile state. Added `ProfileUpdate` type from `Database['public']['Tables']['profiles']['Update']`.
- **`src/types/database.ts`** — added `Relationships: []` to every table so Supabase v2 client resolves `.update()` types correctly.
- **`src/lib/schemas.ts`** — exports `loginSchema`, `registerSchema`, `LoginData`, `RegisterData`. AuthPage imports from here.
- **i18n** — added keys: `auth.resetPasswordHint`, `auth.sendResetLink`, `auth.resetPasswordSent`, `auth.backToLogin`, `auth.registerSuccess`, `profile.language`, `profile.editName`, `profile.namePlaceholder`, `profile.nameSaved` (both `he` + `en`).
- **Unit tests** (`src/__tests__/auth.test.tsx`) — loginSchema, registerSchema, useAuth hook. All pass.
- **E2E** (`e2e/auth.spec.ts`) — 5 smoke tests (no credentials needed); 2 full auth-flow tests that skip unless `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` env vars are set.
- **Test infra** — `src/test/setup.ts` mock exports `isSupabaseConfigured: true`; `vite.config.ts` uses `vitest/config` import; `@types/node` installed + added to `tsconfig.node.json`.

---

## Stage 2 — Products Catalog — COMPLETE (committed to `main`)

- **DB schema** — `categories`, `unit_types`, `products` already defined in `001_initial_schema.sql`; seed data (10 categories, 16 unit types) in `002_seed_data.sql`. No new migration needed.
- **`/products` page** — full implementation replacing the stub: live search bar, category filter chips (scrollable), products grid grouped by category with colored section headers.
- **`ProductCard`** — shows product name (language-aware), category badge with color, shared/personal badge, edit/delete buttons (owner-only, enforced via `created_by === user.id`).
- **"Add Product" dialog** — Hebrew name (required), English name (optional), category select, default unit select (grouped by type: count / weight / volume / cooking). Sheet-style on mobile, centered on tablet+.
- **Edit product** — pre-fills form from existing product values; saves via `UPDATE` with RLS enforcement.
- **Delete product** — confirmation dialog with product name; removes via `DELETE`.
- **`is_shared` flag** — displayed as badge on each card; RLS on Supabase side controls visibility (shared = all users, personal = creator only).
- **TanStack Query** — first real usage: `useQuery` for products/categories/unit_types; `useMutation` for add/update/delete with cache invalidation.
- **i18n** — added `products.*` keys to both `he/common.json` and `en/common.json`.
- **Unit tests** (`src/__tests__/products.test.tsx`) — 8 tests for `filterProducts` (empty query, partial Hebrew/English match, case-insensitivity, null name fallback) + 4 tests for ProductCard name/owner display logic. All 31 suite tests pass.

---

## Stage 2.5 — Bulk Import from CSV / JSON — COMPLETE (committed to `main`)

- **Import button** — toolbar on `/products` page; accepts `.csv` and `.json` files via hidden file input.
- **`src/lib/importProducts.ts`** — `parseImportFile` validates rows with Zod, resolves category/unit names to IDs by Hebrew name, English name, or unit code. Returns `{ toInsert, toUpdate, skipped }`.
- **Duplicate handling (upsert)** — on matching `name_he` or `name_en`:
  - Owner + props changed → `UPDATE` existing product (`category_id`, `default_unit_id`, `name_en`).
  - Owner + no change → skipped as `unchanged`.
  - Not owner → skipped as `duplicateNameHe`.
  - Same name appears twice in the file → second row skipped.
- **`ImportSummaryDialog`** — shows Added / Updated / Skipped counts with per-row reasons. Skipped rows downloadable as CSV for correction.
- **i18n** — `products.import.*` keys (inserted, updated, skipped, reasons) in both `he` and `en`.
- **Unit tests** — 36 product tests covering parser, resolvers, upsert logic, owner guard, within-file dedup. All 55 suite tests pass.
- **DB migration** — `supabase/migrations/003_extra_categories.sql` adds "Health & Pharmacy" (💊 #ec4899) and "Perishables / מתכלים" (🕐 #f43f5e).
- **Sample CSV templates** — `sample_products_import.csv` (English categories/units) and `sample_products_import_he.csv` (Hebrew categories/units).

---

## Stage 2.7 — Add Product to Shopping List (from Products Page) — COMPLETE (committed to `main`)

- **"Add to list" button** — `ListPlus` icon on every `ProductCard`; opens a bottom sheet.
- **Bottom sheet** — lists the user's active (non-archived) shopping lists; quantity stepper (count) or free input (weight/volume); unit chips filtered to the product's unit category; "New List" option creates a list on the fly.
- **Upsert logic** — if the product is already in the selected list (unchecked), bumps quantity; otherwise inserts a new item.
- **Toast** — "Added to [list name]" with a tappable link navigating to that list.
- **i18n** — added `products.addToList.*` keys in both `he` and `en`.

---

## Stage 3 — Shopping Lists (Core) — IN PROGRESS

### 3.1 — DB Migration — COMPLETE
- `shopping_lists`, `list_members`, `shopping_items` tables created in `001_initial_schema.sql`.
- RLS policies in place; indexes on `shopping_items(list_id)` and `shopping_lists(owner_id, is_archived)`.

### 3.2 — Lists Overview Page (`/lists`) — COMPLETE
- Active lists section — cards showing name (or creation date), item count, active badge, missing-list badge.
- Archived section — collapsible toggle, lazy-loaded.
- "New List" FAB opens `NewListDialog`; name defaults to today's date if left blank.
- TanStack Query: separate queries for active and archived lists (archived only fetched when expanded).

### 3.3 — List Detail Page (`/lists/:id`) — COMPLETE
- Header: list name (display-only), back nav, Archive/Reactivate button (owner only).
- Progress bar: "X of Y items picked" with animated fill.
- `AddItemSheet` — two-step bottom sheet: search products → configure quantity + unit → upsert.
  - Upsert: bumps existing unchecked item's quantity; inserts new item otherwise.
  - Inline "Create new product" option when search term has no exact match.
- Item rows: check/uncheck toggle (optimistic spinner), quantity + unit label, delete button.
- Checked items shown with strikethrough + dimmed; FAB hidden on archived lists.
- Empty state with icon illustration.

### 3.4 — Quantity & Units UX — COMPLETE
- Count-type units: +/− stepper capped at minimum 1.
- Weight/volume: free numeric input (min 0.1, step any).
- Unit chips grouped by the product's default unit category; "No unit" chip always available.
- Quantity + unit displayed inline on each item row.

### 3.5 — Archive & Reactivate — COMPLETE; Clone — NEXT
- `archiveMutation` in `ListDetailPage` toggles `is_archived` / `is_active`; button label and icon swap between Archive ↔ Reactivate.
- **Clone not yet implemented** — next task (3.5b).

### 3.6 — Missing Items Quick-Add Flow — NOT STARTED
### 3.7 — Shopping Mode (In-Store UX) — NOT STARTED

---

## Stages 4–8 — Not started
See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the full plan.
