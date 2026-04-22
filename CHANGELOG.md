# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases from v0.10.0 onward are generated automatically by [release-please](https://github.com/googleapis/release-please) from Conventional Commit messages.

## [0.9.0] - 2026-04-22

Initial tagged release. Covers all work merged to `main` through Stage 9 (Events Enhancements) and the first three PRs of Stage 10 (Performance Optimization).

### Stage 0 — Scaffolding & Infrastructure

- Vite + React 18 + TypeScript project bootstrap with strict mode and `@/` path alias.
- Tailwind CSS + shadcn/ui base components; Rubik font; brand color tokens.
- React Router v6 with placeholder routes and `ProtectedRoute` wrapper.
- i18next setup with Hebrew and English locales; dynamic `dir`/`lang` switching and RTL support.
- Supabase client singleton; Row Level Security enabled from day one.
- TanStack Query v5 + Zustand store skeleton.
- Vitest + Testing Library + Playwright; GitHub Actions CI (lint, format, tests, build, E2E, Trivy/Snyk security scans).
- Vercel deployment with preview URLs per branch.

### Stage 1 — Authentication & User Profiles

- `profiles` table with auto-create trigger on `auth.users` insert.
- Login / Register pages with Zod validation, Supabase Auth integration, and Toast feedback.
- `AuthProvider`, `useAuth` hook, protected routes.
- Profile page with editable display name, language preference, and sign-out.
- Forgot password flow via `resetPasswordForEmail`.

### Stage 1.5 — Social Login

- Google OAuth provider via Supabase with "Continue with Google" button on the auth page.

### Stage 2 — Products Catalog

- `categories`, `unit_types`, `products` tables with seed data for common Israeli supermarket items.
- Products page: grid grouped by category, live search, category filter chips, add/edit/delete dialogs.
- Shared vs. personal products (`is_shared` flag).
- Bulk import from CSV / JSON with upsert-on-duplicate and a per-row result summary dialog; skipped rows downloadable for re-import.
- AI auto-suggest (`suggest-product` edge function, Gemini Flash) to fill English name, category, and default unit from a Hebrew product name.
- "Add to list" quick flow from product cards.

### Stage 3 — Shopping Lists Core

- `shopping_lists`, `list_members`, `shopping_items` tables with RLS by role.
- Lists overview with active + archived sections, FAB, create/archive/clone/delete.
- List detail page: inline-editable name, categorised items, check/uncheck, quantity stepper/free input, unit picker grouped by type.
- "Missing Items" auto-created quick-add flow and convert-to-list.
- Shopping Mode with large touch targets and progress bar.

### Stage 4 — Real-time Sharing

- Share dialog with email lookup and member management (owner/editor/viewer roles).
- Supabase Realtime subscriptions for `shopping_items` and `shopping_lists` with a broadcast-based fallback to work around the walrus RLS context issue.
- Deterministic generated avatars via `boring-avatars`; `UserAvatar` and `AvatarStack` components.
- Avatar stack on list cards, list detail header, and profile page; per-item "added by" avatar in list rows.
- Contact-based sharing suggestions via `ContactPicker`.
- Global `auto_share_products` profile toggle (design decision 4.x).

### Stage 5 — Recipes

- `recipes`, `recipe_ingredients`, `recipe_steps` tables; substitute groups.
- Recipes list + detail pages with tool icons, servings scaler, and substitute markers.
- Recipe create/edit form with ingredient builder, substitutes, notes, and reorderable steps.
- Add-to-list flow per ingredient or bulk, with merge prompts for items already in the target list.

### Stage 6 — Events

- Events tables, list, and detail page with countdown, guests, checklist, recipes, and shopping tabs.
- Guest transport logistics, "brings" field, confirmation toggle.
- Combined shopping list generator from attached recipes (servings-aware, duplicate-merging).
- Host equipment inventory on Profile with inline "You have X" deduction on the Equipment tab.
- Contacts: Family / Friend label, optional email with `linked_user_id` lookup, filter chips.

### Stage 9 — Events Enhancements

- **9.1** — Photo album chip on event cards (PR #79).
- **9.2** — Event sharing mirroring lists: `ShareEventDialog`, `useEventRole`, `AvatarStack`, RLS for event children (migration 032), contact picker integration (PR #81).
- **9.4** — Event comments drawer with realtime subscription and post-mortem editor gated on past events (`event_comments` table, migrations 030 + 031) (PR #80).

### Stage 10 — Performance Optimization (partial)

- **10.1** — React quick wins: `useMemo` for derived state, `useDebounce` hook for search inputs, memoized `AvatarStack` (PR #76).
- **10.2** — Optimistic toggle for shopping items with rollback on error (PR #77).
- **10.3** — N+1 fix on Lists page via `get_all_list_members_for_user()` RPC (migration 029, PR #78).

[0.9.0]: https://github.com/sivanbecker/shopping-recipes-events/releases/tag/v0.9.0
