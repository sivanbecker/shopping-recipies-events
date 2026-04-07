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

### 3.5 — Archive, Clone & Reactivate — COMPLETE
- `archiveMutation` in `ListDetailPage` toggles `is_archived` / `is_active`; button label and icon swap between Archive ↔ Reactivate.
- **Clone button** — `Copy` icon, owner-only, sits next to the Archive/Reactivate button in the list detail header.
- `cloneMutation` creates a new active list (same name) then bulk-inserts all items with `is_checked: false` and quantities unchanged.
- Toast "List cloned" with an "Open" action that navigates directly to the new list via `useNavigate`.
- i18n: `lists.cloneSuccess`, `lists.open` added in both `he` and `en`.

### 3.6 — Missing Items Quick-Add Flow — COMPLETE
- **"Something missing?" FAB** — amber button on the Lists page; finds or auto-creates an active `is_missing_list` list and navigates to it. Subsequent taps always go to the same list.
- **Pinned at top** — missing list sorts above all other active lists (`order by is_missing_list desc`).
- **"Convert to Shopping List" button** — appears in the ListDetailPage header when viewing a missing list; copies all items to a new regular list then **deletes** the missing list; navigates directly to the new list.
- **`filterProducts` generic** — made `<T extends Product>` so enriched types (`ProductWithUnit`) are preserved through filtering.
### 3.7 — Shopping Mode (In-Store UX) — COMPLETE
- **"Start Shopping" button** — appears below the progress bar on active, non-archived, non-missing lists with items; enters shopping mode.
- **Larger touch targets** — check circle grows from `h-6 w-6` → `h-8 w-8`; row padding `p-3.5` → `p-4`; item name `text-sm` → `text-base`.
- **"In Cart" collapsible section** — checked items collapse under a `ChevronDown` toggle ("In Cart (N)") rather than rendering inline with unchecked items.
- **Delete button hidden** in shopping mode to prevent accidental removals.
- **"Done Shopping" fixed bar** — sits above the bottom nav; tapping opens a confirmation dialog to archive the list or keep shopping.
- **Exit button** — replaces Clone/Archive buttons in the header so users can leave shopping mode without archiving.
- **FAB raised** in shopping mode so it clears the Done Shopping bar.
- **i18n** — added `exitMode`, `inCartSection`, `donePromptTitle`, `donePromptBody`, `archiveAndDone`, `keepShopping` keys (both `he` + `en`).

---

## Stage 4 — Real-time Sharing — IN PROGRESS

### 4.1 — Invite Users to a List — COMPLETE
- **DB migration 005** — two `security definer` Postgres functions:
  - `find_user_by_email(p_email)` — queries `auth.users` by email (inaccessible to anon key otherwise)
  - `get_list_members(p_list_id)` — fetches list members with joined profile display names
- **Share button** — owner-only `UserPlus` icon button in list detail header
- **ShareListDialog component** — center modal with:
  - Members section: displays member display names + inline role picker (Can Edit / Can View) + remove button
  - Invite section: email input + role selector + Add button
  - Empty state: "Not shared with anyone yet"
  - Error handling: "No account found" / "Already a member" with inline error display
- **Mutations**: `addMemberMutation`, `removeMemberMutation`, `updateRoleMutation` with optimistic updates via TanStack Query
- **Types** — added `list_members` table types + RPC function types; exported `ListMember`, `ListMemberWithProfile`
- **i18n** — 16 new keys under `sharing.*` in both `he` and `en` locales

### 4.2 — Supabase Realtime Subscriptions — COMPLETE
- **Channel subscription** — single channel per list view (`list-detail-${id}`)
  - Subscribe to `shopping_items` changes (all events: INSERT, UPDATE, DELETE) filtered by `list_id`
  - Subscribe to `shopping_lists` UPDATE events (name, archived status) filtered by list `id`
- **Smart cache updates**:
  - DELETE: remove item from cache directly (no join re-hydration needed)
  - UPDATE is_checked: patch item in-place for instant no-flicker UI feedback (hot path)
  - UPDATE other fields & INSERT: invalidate queries (need fresh joins from DB)
  - List updates: invalidate both detail and overview list queries
- **Cleanup** — `supabase.removeChannel(channel)` on component unmount
- **Conflict resolution** — implicit last-write-wins via Postgres server state (no client-side reconciliation needed)
- **Test infrastructure** — fixed Supabase mock to support `removeChannel()` method
- **Tests** — 8 new tests verifying channel setup, subscription lifecycle, cache operations
- **Product visibility fix** — non-owners can now see shared lists correctly. When an item's product is private to the owner (`is_shared=false`), the item shows "—" instead of crashing. This surfaces the product-sharing design issue (see 4.x Planning below).

### 4.x — Product Sharing Design (Planning)

**Issue:** When Account A shares a list with Account B, items added with private products (created by A with `is_shared=false`) appear as "—" to B because RLS blocks access.

**Approaches to consider:**
1. **Auto-share products on list share** — when a list is shared, auto-set all its product items to `is_shared=true` for visibility
2. **User share-all setting** — let users toggle "share all my products" globally
3. **Per-product share on item add** — when adding items to a shared list, prompt user to choose: "Share this product with list members?" or "Keep private?"
4. **RLS role-based visibility** — if item.added_by is a list member, their products become visible to other members for that list's context (more complex, context-specific access)

**Current behavior:** Items with inaccessible products show "—" gracefully without crashing. Not ideal UX but functional.

---

## Stages 4.3–8 — Not started
See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the full plan.
