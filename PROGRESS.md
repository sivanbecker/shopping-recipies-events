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

## Stage 2 — Products Catalog — NOT STARTED

`src/pages/Products/ProductsPage.tsx` is a placeholder stub ("Coming soon").

### Tasks
- [ ] DB migration: `categories`, `unit_types`, `products` tables (001+002 migrations may already have seed data)
- [ ] `/products` page — grid grouped by category, live search, category filter chips
- [ ] "Add Product" dialog — Hebrew name, English name, category, default unit
- [ ] Edit / delete product
- [ ] `is_shared` flag — shared products visible to all; personal products only to creator
- [ ] Unit tests: `ProductCard` renders, search filter fn
- [ ] E2E: add product → verify → delete

### Key files to touch
- `supabase/migrations/` — new migration for products schema
- `src/pages/Products/ProductsPage.tsx` — replace stub
- `src/types/database.ts` — add products/categories/unit_types types
- `src/locales/he/common.json` + `src/locales/en/common.json` — products i18n strings

---

## Stages 3–8 — Not started
See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the full plan.
