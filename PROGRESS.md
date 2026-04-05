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

## Stages 3–8 — Not started
See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the full plan.
