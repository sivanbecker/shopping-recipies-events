# Project Progress

> Last major update: 2026-04-23. Entries are ordered roughly newest-first within each stage. Completed stages are retained below for historical context.

---

## Stage 11.8 — Advanced Appearance Mode — COMPLETE (PRs #101, #102, merged to `main`)

- **PR #101** — Full advanced appearance UI: Basic/Advanced toggle in AppearancePanel, 24-color accent palette grid, extended background picker (10 options: white, aero, blobs + 7 new gradients/noise), `AppearanceMode` type, `applyCustomAccent`/`clearCustomAccent` helpers, `hexToHsl` conversion, Zustand store fields + persistence, DB migration 035 (`appearance_mode`, `custom_accent_color`, expanded `app_background` CHECK constraint), i18n keys in both `he` and `en`.
- **PR #102 (bugfix)** — `App.tsx` was only passing 4 of 6 theme fields to `applyTheme` on mount, clearing custom accent on every page load. Fixed by subscribing to and passing `appearanceMode` + `customAccentColor`. Also fixed `theme.ts` and `useAppStore.ts` which were missing the new types/fields on the `main` branch (the stage-11.8 branch had them but they hadn't landed in `main` yet).

---

## Stage 11.9 — Contact Invitations — COMPLETE (PR #106, merged to `main`)

### DB migrations
- **036** — `contact_invitations` table (token, inviter_id, invitee_email, label, status, expires_at, accepted_at, invitee_id) + RLS + indexes
- **037** — `accept_invitation` SECURITY DEFINER RPC (upserts mutual contact rows, enforces email match, handles accept/decline); unique constraint `contacts(owner_id, linked_user_id)`; `peek_invitation` RPC (no auth, safe public data only); `revoke_invitation` RPC
- **038** — Extended `peek_invitation` to return `invitee_email` for email-mismatch validation
- **039** — Extended `notification_entity_type` enum + `notification_type` enum with contact values; `notify_contact_added` trigger fires `AFTER INSERT ON contacts` (when `linked_user_id IS NOT NULL`) to notify the inviter; `NotificationsPanel` navigates to `/contacts` on click

### Edge functions
- **`send-contact-invitation`** — validates JWT; self-invite guard, spam-limit guard (max 5 pending), idempotent re-invite (returns existing token); inserts invitation row; sends HTML email via nodemailer (Gmail SMTP `shopcookhost@gmail.com`). Fresh invites return `{ ok: true }`, re-invites return `{ ok: true, token }`.
- **`accept-contact-invitation`** — thin pass-through to `accept_invitation` RPC via PostgREST (kept for future use; UI now calls the RPC directly for lower latency)

### Frontend
- **`InviteAcceptPage.tsx`** — public route `/invite/accept`; state machine: loading → invalid | expired | already_responded | email_mismatch | unauthenticated | pending | success | declined; calls `accept_invitation` RPC directly (not edge function) for faster response
- **`AuthPage.tsx`** — reads `inviteToken` from `location.state` (email/password) or `?invite_token=` query param (Google OAuth `redirectTo`); redirects to `/invite/accept?token=...` after successful sign-in/register
- **`ContactsPage.tsx`** — "Invite" button in header opens `InviteContactDialog` (email + label pill toggle; success state with copy-link button; `self_invite` / `spam_limit` error toasts); `PendingInvitationsCard` collapsible amber card with per-row expiry countdown and Revoke button

### i18n
- 13 keys under `contacts.invite` in both `en` and `he`: `invite`, `inviteTitle`, `inviteEmail`, `inviteSend`, `inviteSent`, `inviteCopyLink`, `inviteSelfError`, `inviteSpamError`, `pendingInvites`, `pendingExpiresIn`, `pendingRevoke`, `pendingRevokeSuccess`
- `contact_added` notification string in `en/common.json` and `he/common.json`

### Type system (`database.ts`)
- `contact_invitations` Row / Insert / Update; `peek_invitation`, `revoke_invitation`, `accept_invitation` in Functions block; `notification_entity_type` and `notification_type` extended with contact values

### ⚠️ Required before testing
Run `supabase db push` to apply migrations 036–039. Set `GMAIL_SMTP_PASSWORD` secret to the App Password for `shopcookhost@gmail.com`.

---

## Stage 9 — Events Enhancements — COMPLETE (merged to `main`)

### 9.1 — Photo Album Chip on Event Cards — COMPLETE (PR #79, commit `b5b36cb`)
- `EventCard` on `/events` shows a compact "Album" chip when `photo_album_url` is a valid `http(s)` URL
- Chip opens the album in a new tab (`rel="noopener noreferrer"`); `stopPropagation` prevents triggering card navigation
- Reuses existing `events:detail.photoAlbum` / `events:detail.openAlbum` i18n keys and `ImageIcon` from `lucide-react`

### 9.4 — Event Comments & Post-Mortem — COMPLETE (PR #80, commit `f08d03c`)
- **Migration 030** — `event_comments` table (`id`, `event_id`, `user_id`, `body`, `created_at`, `updated_at`) with RLS: event owner + members can read/insert; author can update/delete
- **Migration 031** — `updated_at` trigger on `event_comments`
- **`EventCommentsPanel.tsx`** — drawer with scrollable comment list (avatar + display name + timestamp + body), textarea + send, realtime subscription on `event_comments` filtered by the open event
- **`EventRetroDialog.tsx`** — editor for the four `retro_*` fields already on `events` (migration 019): `retro_enough_food`, `retro_what_went_wrong`, `retro_what_went_well`, `retro_remember_next_time`
- **`EventDetailPage` header** — two new buttons: Comments (always enabled) and Post-mortem (enabled only when event date is in the past, greyed out with tooltip otherwise)
- i18n: added 39 new keys in both `en/events.json` and `he/events.json`

### 9.2 — Event Sharing — COMPLETE (PR #81, commit `ead53b9`)
- **Migration 032** — extends RLS on events + child tables (invitees, equipment, recipes, shopping lists) so event members can read/edit per role; event shows for owner **or** members in list query
- **`ShareEventDialog.tsx`** — mirrors `ShareListDialog`: member list with role picker (editor/viewer), invite via email, `ContactPicker` integration for share-by-contact
- **`useEventRole` hook** — parallels `useListRole`, returns `owner | editor | viewer | null`
- **Share button** added to `EventDetailPage` header; gated by `useEventRole`
- **`AvatarStack`** on event cards (`EventsPage`) and on the event detail header — same component as lists
- Events page query now returns events where user is owner OR member (via `event_members`)

### 9.3 — Email Notifications for Shares — DEFERRED
Parked 2026-04-22 per project plan. Revisit post-MVP.

---

## Stage 10 — Performance Optimization — COMPLETE (all 6 PRs merged to `main`)

### PR 1 — React quick wins — COMPLETE (PR #76, commit `18265af`)
- `useDebounce` hook added (`src/hooks/useDebounce.ts`, 200ms default)
- `useMemo` for `uncheckedItems`, `checkedItems`, and `groupByCategory` result in `ListDetailPage`
- Debounced search applied in `ProductsPage`, `RecipesPage`, and `AddItemSheet` (ListDetailPage)
- `useMemo` for `grouped` / `uncategorized` in `ProductsPage`
- `AvatarStack` wrapped with `React.memo`, member sort memoized
- Bugfix follow-up (`c9cff12`) after merge

### PR 2 — Optimistic toggle — COMPLETE (PR #77, commit `9aa179b`)
- `toggleMutation` in `ListDetailPage` now patches `is_checked` in the cache via `onMutate` so items jump to the "done" section instantly
- Snapshot + rollback on error; `invalidateQueries` removed from `onSettled` (realtime + broadcast reconcile)
- Undo toast path unchanged

### PR 3 — N+1 fix on ListsPage — COMPLETE (PR #78, commit `3aefcd8`)
- **Migration 029** — `get_all_list_members_for_user()` RPC returns all members across all of caller's owned + shared lists in one query
- `ListsPage` uses a single `useQuery(['all_list_members', user.id])`; builds `Map<listId, members[]>` with `useMemo`; passes `members` to each `ListCard` as a prop
- Removed the per-card `useQuery(['list_members', list.id])` → 10 lists now = 1 query instead of 11

### PR 4 — DB indexes — COMPLETE (PR #90)
- **Migration 033** — three new indexes: `shopping_items_list_checked_idx` (list_id, is_checked, sort_order, created_at), `shopping_items_product_idx` (product_id), partial `shopping_lists_active_idx` (owner_id, is_archived, created_at) WHERE deleted_at IS NULL

### PR 5 — Route lazy loading — COMPLETE (PR #91)
- All page components in `src/App.tsx` converted to `React.lazy(() => import(...))`; `<Routes>` wrapped in `<Suspense>` with skeleton fallback; `AuthPage` kept eager for first paint

### PR 6 — Realtime server-side filter — COMPLETE (PR #92)
- `filter: \`list_id=eq.${id}\`` added to the `postgres_changes` subscription for `shopping_items` in `ListDetailPage` — eliminates client-side filtering of all-table change events

---

## Stage 7 (partial) — UX Polish

### Skeleton loaders — COMPLETE (PR #93)
- All data-fetching states across every page now show skeleton placeholders instead of spinners
- Covers: `ListsPage`, `ListDetailPage`, `ProductsPage`, `RecipesPage`, `RecipeDetailPage`, `EventsPage`, `EventDetailPage`, `ProfilePage`, `ContactsPage`, `TrashPage`

### Category item count — COMPLETE (PR #94)
- Each category section header in `ListDetailPage` now shows the number of unchecked items it contains, e.g. "DAIRY (3)" — applies to both normal and shopping mode views

### App version in profile menu — COMPLETE (PR #96)
- App version from `package.json` injected at build time via Vite `define` as `__APP_VERSION__`; displayed as `v0.9.1` at the bottom of the profile dropdown, below Sign Out
- `src/vite-env.d.ts` updated with `declare const __APP_VERSION__: string`

---

## Voice Search & Shopping List UX — COMPLETE (merged to `main`)

### Voice input across the app
- **`useVoiceInput` hook** (`src/hooks/useVoiceInput.ts`) — Web Speech API wrapper with Hebrew/English support, mobile-tolerant auto-stop, interim-result handling
- **ProductDialog** — voice mic button next to Hebrew and English name fields (`ac0f865`); clear buttons, char filtering, strict voice-to-field binding (`bc16205`); TS build-error fixes for Web Speech API (`544f471`)
- **AddItemSheet** — voice mic button on the search input (`103c984`)
- **ProductsPage** — voice search on the top search bar (`f862cd5`)
- Mobile Hebrew stability fixes: final transcript flush on `onend` (`ec98cf7`), interimResults disabled for ProductDialog (`80601fb`), simplified ProductDialog voice to match list search (`4933dbc`), auto-stop timeouts tuned (1s then 2s — `bbb93fa`, `af608d5`), filled-field fix (`3e27485`)
- Interim results enabled for faster search response on ProductsPage/AddItemSheet (`23b8591`)

### Shopping list UX improvements
- **Category grouping with collapsible sections** in `ListDetailPage` (`4b1f20b`) — items group under category headers that can be expanded/collapsed
- **Mark-category-done** (`9a048f9`) — checkbox on each category header marks all items in that category as checked; swipe-right gesture on the header does the same on mobile
- **Enlarged category headers** for mobile readability (`1617867`, `d9fa958`)
- **Full product creation modal from shopping list** (`0fef813`) — "Create new product" flow in `AddItemSheet` now opens the real `ProductDialog` with AI suggest, not a stripped-down inline form; extracted `ProductDialog.tsx` as a shared component used by both `ProductsPage` and `ListDetailPage`
- **AI suggest button in edit product modal** (`bfacf1f`) — sparkle button now available on existing products, not just when adding
- **Inline quantity + unit editing on list items** (`cf1052b`) — tap quantity/unit on an item row to edit in place; undo support
- **Countdown bar on undo toast** (`f0ada74`) — visual countdown of the 10s undo window; new `UndoToastContent.tsx` component
- **Inline list name editing** (`fa309fb`) — owners and editors can rename the list from the detail header
- **Hide action button labels on mobile** in list detail header (`8ed8a99`)

---

## Collaboration & Permissions — Follow-up fixes — COMPLETE

- **NotificationBell refactor** (`00dda3e`) — `useNotifications` lifted to `NotificationBell` to avoid duplicate Realtime channel (panel was opening a second channel)
- **Auth token fix in notifications** (`b2357ff`) — `supabase.realtime.setAuth` called in the `useNotifications` effect so notifications work on `INITIAL_SESSION` page reloads
- **Auth guard in delete/leave flows** (`04ddf67`) — `CollaboratorsDialog` and `DeleteListDialog` verify user auth before mutating
- **Access-loss redirect** (`5e04b53`) — `ListDetailPage` redirects to `/lists` with a toast when the list returns 0 rows (user was removed as a member)
- **Migration 028** — `find_user_by_email` `p_list_id` parameter made optional so share flows still work outside a list context (`a826972`)

---

## Supabase API Key Migration — COMPLETE (PR #74, commit `46fb99c`)

- Migrated from the legacy `anon` key to the new Supabase `VITE_SUPABASE_PUBLISHABLE_KEY`
- Updated: `.env.example`, `.github/workflows/ci.yml`, `README.md`, `docs/SETUP.md`, `src/lib/supabase.ts`
- Old key retained as fallback for backwards compatibility during rollout

---

## CI & Tooling

- **Snyk scan non-blocking** (`7d9f292`) — Snyk job no longer fails the pipeline; security review can still see findings
- **Ignore OWASP scan artifacts** (`a0d837b`) — `.gitignore` entry for local OWASP scan output
- **`ideadd` skill** (`fdd3191`, `cf412e3`, `81f71e9`) — skill automates committing manual edits to `BRAINDUMP.md` and opening/merging a PR; now waits for PR checks before merging

---

## Stage 2.8 — AI Auto-Suggest for Product Fields — IN PROGRESS (branch: `feat/ai-product-suggest`)

### What's implemented
- **`supabase/functions/suggest-product/index.ts`** — Deno edge function that receives a Hebrew product name + the app's categories and unit_types arrays, calls Google Gemini, and returns `{ name_en, category_id, default_unit_id }` using the app's real DB IDs
- **`supabase/config.toml`** — sets `verify_jwt = false` for this function (it only proxies to Gemini, no DB access, safe to leave open)
- **ProductDialog (add mode)** — sparkle ✨ button next to the Hebrew name field; click triggers the edge function, pre-fills English name + category + unit; spinner while loading; silent on failure
- **i18n** — `products.suggest` / `products.suggesting` in both `he` and `en`
- **`docs/PROJECT_PLAN.md`** — Stage 2.8 added

### Debugging history (issues hit and fixed)
1. **401** — Edge function was requiring JWT by default. Fixed by deploying with `--no-verify-jwt` and adding `supabase/config.toml`
2. **502 / 404 from Google** — Wrong API key used initially; then wrong model name (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-latest` all returned 404). Fixed by listing available models via `curl ".../v1beta/models?key=..."` — correct name is `gemini-flash-latest`
3. **502 / JSON parse error** — `maxOutputTokens: 200` was too low, truncating the JSON mid-string. Fixed by raising to `512` and adding `responseMimeType: 'application/json'` to force Gemini to output raw JSON (no markdown fences)

### Current state
Last fix (`maxOutputTokens: 512` + `responseMimeType: 'application/json'`) was deployed but **not yet verified working end-to-end**. Need to test the sparkle button in the UI and confirm suggestions come through correctly.

### To do before merging
- [ ] Verify the feature works end-to-end in the UI (Hebrew name → sparkle click → fields auto-fill)
- [ ] Remove debug `console.log` lines from the edge function (`index.ts` lines ~98–104)
- [ ] Commit `supabase/config.toml` to the branch
- [ ] Run quality gates: `npm test`, `npm run lint`, `npm run format`
- [ ] Open PR and merge to `main`

### Deploy command
```bash
supabase functions deploy suggest-product --no-verify-jwt
```

---

## Stage 1.5 — Social Login (Google OAuth) + Google Profile Picture — COMPLETE (committed to `main`)

- **Google sign-in button** — added to `AuthPage` above the login/register tabs with an "or" divider; visible in both Login and Register views, hidden on Forgot Password view.
- **`GoogleIcon`** — inline SVG component (`src/components/icons/GoogleIcon.tsx`) using the official Google "G" four-colour logo; no external image dependency.
- **OAuth flow** — calls `supabase.auth.signInWithOAuth({ provider: 'google' })` with `redirectTo: origin + '/auth'`. Redirecting back to `/auth` (public) instead of `/lists` (protected) avoids a race condition where `ProtectedRoute` would strip the `?code=` query param before Supabase could exchange it for a session.
- **Session pickup** — `useEffect` in `AuthPage` watches `user` from `useAuth()` and navigates to `/lists` once the OAuth session is established.
- **i18n** — added `auth.continueWithGoogle` and `auth.orDivider` to both `he/common.json` and `en/common.json`.
- **Test fix** — `App.test.tsx` smoke test now wraps `AuthPage` in `AuthProvider` (required because `AuthPage` now calls `useAuth()`).
- **Google profile picture** — `UserAvatar` now accepts an optional `avatarUrl` prop; renders a real `<img>` when the URL is present, falls back to the boring-avatar on load error or when absent. Migration 025 adds `avatar_url` to the `profiles` table and updates the `handle_new_user` trigger to capture Google's photo on sign-up; `get_list_members` RPC updated to return `avatar_url` so all member avatars (AvatarStack, ShareListDialog, ListDetailPage) also show real photos.
- **PROJECT_PLAN.md** — added Stage 1.5 section with tasks and manual testing checklist; updated tech stack row and stage summary table.

---

## Stage 0 — Scaffold — COMPLETE (committed to `main`)
Full project scaffold, all routes, AuthPage, ProfilePage (basic), DB types, migrations, CI, Vercel.

### CI improvements (PR #28)
- Added `build` job to `.github/workflows/ci.yml` — runs `npm run build` (`tsc -b && vite build`) on every PR and push to `main`
- Blocks merge if TypeScript or bundler errors are present, preventing broken deploys from reaching Vercel
- Also fixed 9 TypeScript errors that had been silently slipping through (missing prop pass, wrong property access, undefined not narrowed, Supabase FK type gaps)

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
### Tests — Stage 3 (`src/__tests__/listLogic.test.ts`)
- **Progress bar `pct`** — empty list, none/all checked, partial, rounding edge cases
- **`AddItemSheet` upsert** — finds unchecked item → UPDATE path; checked/unknown product → INSERT; bumped qty correct
- **Clone items mapping** — all items reset to `is_checked: false`; quantities preserved; `list_id`/`added_by` set correctly

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
  - `postgres_changes` listeners for `shopping_items` (all events) and `shopping_lists` (UPDATE) — no server-side filter, client-side list ID guard
  - `broadcast` listeners for `items-changed` and `list-changed` — the primary cross-user notification path (see below)
- **Root cause of Realtime not working for collaborators:** Supabase Realtime's walrus extension evaluates RLS row-visibility checks in an internal Postgres context where `auth.uid()` cannot be resolved for any user when policies do cross-table joins (`shopping_items` → `list_members` / `shopping_lists`). This caused walrus to silently drop events for ALL subscribers — owners appeared to work only because their mutations called `queryClient.invalidateQueries` on success.
- **Fix — Realtime Broadcast:** After every mutation that changes shared data, the mutating client sends a broadcast event on the same channel. All subscribers receive it and invalidate their query cache. Broadcast bypasses walrus entirely; the subsequent data refetch is still protected by REST-side RLS.
  - `broadcastChange(listId, 'items-changed')` called after add/toggle/remove item mutations
  - `broadcastChange(listId, 'list-changed')` called after archive/reactivate mutation
  - Helper uses `supabase.getChannels()` to find the live channel without passing refs
- **Secondary fix — RLS policy (migration 006):** Rewrote `shopping_items` SELECT policy to use direct subqueries instead of `security definer` helper functions. Avoids the walrus context issue if Supabase ever improves walrus for this schema. Also eliminates any risk of `security definer` bypassing expected RLS context.
- **Explicit Realtime auth:** `supabase.realtime.setAuth(session.access_token)` called before subscribing, guarded by `!session` in the effect. Supabase JS v2 only syncs the JWT to Realtime on `SIGNED_IN`/`TOKEN_REFRESHED`, not on `INITIAL_SESSION` (page-load restore) — explicit call ensures walrus always has the correct JWT.
- **Smart cache updates (postgres_changes path):**
  - DELETE: remove item from cache directly
  - UPDATE is_checked: patch item in-place for instant no-flicker UI feedback
  - UPDATE other fields & INSERT: invalidate queries (need fresh joins from DB)
  - List updates: invalidate both detail and overview list queries
- **Cleanup** — `supabase.removeChannel(channel)` on component unmount
- **Test infrastructure** — fixed Supabase mock to support `removeChannel()` method
- **Tests** — 8 tests verifying channel setup, subscription lifecycle, cache operations
- **Fixes shipped alongside:**
  - Shared lists now appear on the overview page for invited members (removed erroneous `owner_id` filter from `ListsPage` query — RLS handles access control)
  - `ItemRow` now guards against `product: null` for items whose products are private to the owner — shows "—" instead of crashing

### 4.5 — User Avatars & Shared List Social UX — COMPLETE
- **Avatar generation** — installed `boring-avatars` package; deterministic SVG avatars seeded by `user_id`
- **`UserAvatar` component** — renders avatar with optional ring highlight for owner distinction; includes title tooltip
- **`AvatarStack` component** — overlapping avatar display (owner always first, max 3 visible, "+N" for overflow)
- **ProfilePage header** — replaced generic user icon with large avatar next to display name
- **ShareListDialog** — replaced user icons in member rows with avatars; each member shows their unique avatar
- **ListDetailPage header** — added AvatarStack below list name (shows owner + invited members)
- **ListsPage cards** — added AvatarStack below item count (shows owner + invited members)
- **Migration 007** — updated `get_list_members` RPC to return owner + invited members (via UNION query)
- **PR #13** — All changes committed and pushed

### 4.x — List-Level Product Sharing — COMPLETE
- **Issue:** Items with private products (`is_shared=false`) appeared as "—" to list members (RLS blocked the product join)
- **Approach:** Expand products SELECT RLS to allow visibility when two users share any list together
- **Migration 008** — new `USING` clause with 5 conditions:
  1. `is_shared = true` (globally shared, unchanged)
  2. `created_by = auth.uid()` (own product, unchanged)
  3. Creator owns a list the current user is an invited member of
  4. Current user owns a list the creator is an invited member of
  5. Both are invited members of the same list
- **ProductsPage catalog** — explicit `.or('is_shared.eq.true,created_by.eq.{uid}')` filter added so the catalog stays as-is (own + globally shared only)
- **AddItemSheet / Add-to-list** — unchanged; relies on new RLS, automatically surfaces list-mates' private products
- **Product creation** — unchanged; products default to `is_shared: false`, visible to list-mates through RLS

### Tests — Stage 4 (`src/__tests__/listLogic.test.ts` + `listDetail.test.tsx`)
- **Realtime DELETE** — removes only the targeted item by ID using `['shopping_items', listId]` query key; other items untouched
- **Realtime `is_checked` UPDATE** — patches only the matching item in-place; sibling items unchanged
- **Cross-list cache isolation** — patching one list's cache does not affect another list's cache entry
- Note: broadcast send-path (`broadcastChange` calling `supabase.getChannels().find().send()`) is not unit-tested — the function is integration-level and relies on a live Supabase channel reference

### 4.6 — Item-Level "Added By" Avatar — COMPLETE
- Each item row in `ListDetailPage` now shows a 20px avatar of the user who added the item
- Cross-referenced against the `members` array already loaded in the page — no extra DB query
- `UserAvatar` placed between quantity label and delete button; tooltip shows display name
- Works in both normal mode and shopping mode

---

## Stage 5 — Recipes — COMPLETE (merged to `main` via PR #27)

### 5.1–5.5 — Full recipe management — COMPLETE
- **RecipesPage** — list view with live search by title, filter by tool, and owner-only delete
- **RecipeFormPage** — create/edit recipes with:
  - Metadata: title, description, servings, prep time, tool checkboxes
  - Ingredient builder: product search, quantity, unit (all DB units), notes, substitute grouping
  - Steps builder: add/remove preparation steps
- **RecipeDetailPage** — view recipes with:
  - **Servings scaling**: adjust servings spinner → all ingredient quantities scale reactively
  - Ingredient grouping with substitutes (indented, dimmed, `<1>` badge)
  - Preparation steps
- **i18n** — 25+ new keys for recipe UI in both `he` and `en`
- **DB Migration 009** — creates `recipes`, `recipe_ingredients`, `recipe_steps` tables with RLS
- **Shared/Personal badges** — recipes default to personal; can be shared

### Tests — Stage 5 (`src/__tests__/recipeLogic.test.ts`)
- **Ingredient scaling** — double/halve/identity/fractional/single-serving/arbitrary scaling factor
- **"Add all to list" upsert** — merges qty for existing unchecked item; inserts for new product; inserts when matching item is checked; decimal qty handled correctly

### Recipe Feature Fixes & Improvements (PR #27, branch: fix/recipe-feature)

#### Unit Selection
- Removed "Shopping unit (optional)" section from ingredient form — was confusing and broken
- Unit dropdown now shows **all units from DB** (no longer filtered by product type)
- Fixed ambiguous double FK join on `unit_types` (`unit_id` + `shopping_unit_id` both pointing to same table) that caused Supabase PostgREST to return `SelectQueryError`, making every recipe detail/edit page show "Not Found"
- Fix: query now fetches `unit_id` as a plain column; unit objects resolved client-side from a separate `unit_types` query

#### Add to Shopping List — Redesigned
- Removed the old "Add all to list" single button
- **Per-ingredient checkboxes** on the recipe detail page — all unchecked by default
- **Check all / Uncheck all** toggle next to the ingredients section header
- **"Add marked to list (N)"** button — only enabled when at least one ingredient is checked; shows count
- After selecting a list, confirm step shows each checked ingredient with **editable quantity and unit dropdown** before adding
- Only the edited values are inserted; upsert logic unchanged (merges with existing unchecked items)

#### Tools — DB-driven (Migration 018)
- Replaced hardcoded `TOOLS` const with a `tools` DB table (`key`, `label_he`, `label_en`)
- **DB Migration 018** — creates `tools` table, seeds all 7 tools, enables RLS (public read)
- Added **Mixer** as a new tool (key: `mixer`)
- All three recipe pages (`RecipesPage`, `RecipeDetailPage`, `RecipeFormPage`) now fetch tools from DB and display the correct label per language — no code change needed to add future tools
- Removed `tools.*` i18n keys (labels now come from DB)

#### Known Issues / Design Decisions
1. **Unit mismatch between shopping and recipes** — not yet resolved:
   - Shopping context uses count/packages; recipe context uses weight/volume
   - When adding recipe ingredients to a list, the recipe unit is used as-is
   - To fix later: (a) per-product unit overrides, (b) conversion mapping, or (c) show recipe units separately in the list

---

## Stages 4.3 and 4.4 — Not started
See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the full plan.

---

## Stage 6 — Events

### 6.1 — Events CRUD + Contacts — COMPLETE (branch: `feat/stage-6.1-events-crud`)

#### DB Migration (`supabase/migrations/019_events_schema.sql`)
Creates all event-related tables in one migration (matches the recipes precedent):
- `contacts` — per-user reusable guest contact list with `name`, `phone`, `party_size` (how many people this contact represents), `linked_user_id` (optional app account)
- `host_inventory` — global per-user equipment inventory (`item_type`, `label`, `quantity_owned`) — feeds the equipment calculator in 6.3
- `events` — core event record: `title`, `date`, `location`, `owner_id`, `notes`, `photo_album_url`, plus 4 post-event retrospective fields (`retro_enough_food`, `retro_what_went_wrong`, `retro_what_went_well`, `retro_remember_next_time`)
- `event_members` — app users invited to collaborate on the event (role: editor/viewer)
- `event_invitees` — per-event guest list: can reference a `contact` (via `contact_id`) or be a one-time guest; includes `party_size`, `confirmed`, `brings`
- `event_equipment` — per-event equipment needs with `quantity_needed`, `is_default` flag (napkins, foldable table always added)
- `event_recipes` — recipes attached to event with `servings_override` and `is_dessert` flag
- `event_shopping_lists` — shopping lists linked to the event
- Full RLS on all tables (owner + event_members access); indexes on all FK columns
- **Migration 020** — rewrote `events_select` to use `IN (SELECT event_id FROM event_members)` instead of unqualified EXISTS
- **Migration 021** — fixed infinite RLS recursion between `events` and `event_members`: `events_select` is now owner-only (no cross-table reference); `event_members_select` allows self-access + owner access. Same class of bug as migration 006 for shopping_items.

#### TypeScript types (`src/types/database.ts`, `src/types/index.ts`)
- Replaced old `events` / `event_guests` types with the full new schema
- Added convenience types: `Contact`, `HostInventoryItem`, `EventMember`, `EventInvitee`, `EventEquipment`, `EventRecipe`, `EventShoppingList`
- Added enriched types: `EventWithCounts`, `EventRole`

#### UI
- **`EventsPage`** — replaces the "Stage 6 — Coming soon" stub:
  - Upcoming event cards showing title, countdown badge (Today! / Tomorrow / N days to go), date, location
  - Collapsible "Past events" section with count badge
  - Owner-only delete with inline confirmation dialog
  - "New Event" FAB (purple)
- **`NewEventDialog`** — create/edit bottom sheet:
  - Fields: title (required), date+time (required), location, notes, photo album URL
  - Reused for edit mode from the EventDetailPage header
- **`EventDetailPage`** — replaces the placeholder:
  - Overview card: title, countdown badge, date, location, notes, photo album link (opens in new tab)
  - Edit (pencil) + Delete (trash) owner-only buttons in header
  - Tab bar: Invitees / Equipment / Recipes / Shopping (stubs showing "coming soon" — filled in subtasks 6.2–6.4)
- **`ContactsPage`** (`/contacts` route) — full CRUD for reusable guest contacts:
  - Contact cards: name, party size, phone
  - Add/edit bottom sheet with name, phone, party size stepper
  - Delete with inline confirmation
  - Accessible from Profile page via "Manage Contacts" card (with Users icon)
- **`ProfilePage`** — added "Manage Contacts" link card above Sign Out

#### Event helpers (`src/lib/eventHelpers.ts`)
- `countdownLabel(date)` — returns `{ key, params }` for i18n interpolation (wraps existing `daysUntil`)
- `isUpcoming(event)` — true when event date is today or in the future
- `sortEventsByDate(events)` — upcoming sorted ascending (nearest first), past sorted descending (most recent first)

#### i18n
Added keys to both `he` and `en` under `events.*`:
- Form fields: `form.title`, `form.date`, `form.location`, `form.notes`, `form.photoAlbum`
- Detail: `detail.location`, `detail.openAlbum`, `detail.comingSoon`
- Actions: `edit`, `save`, `cancel`, `create`, `delete`, `confirmDelete`, `confirmDeleteHint`
- Contacts: `contacts.title`, `contacts.add`, `contacts.edit`, `contacts.name`, `contacts.phone`, `contacts.partySize`, `contacts.partySizeHint`, `contacts.empty`, `contacts.emptyHint`, `contacts.manage`, `contacts.person`, `contacts.people`, `contacts.confirmDelete`, `contacts.confirmDeleteHint`
- `pastEvents` section label

#### Tests (`src/__tests__/eventLogic.test.ts`) — 13 tests
- `countdownLabel()`: today, tomorrow, N days left, N days ago, far-future
- `isUpcoming()`: today, future, past
- `sortEventsByDate()`: empty input, upcoming nearest-first, past most-recent-first, upcoming before past, immutability

### ⚠️ Required before testing 6.1
Run `supabase db push` (or apply migration 019 via the Supabase dashboard) — the new tables and RLS policies must exist in the DB before the app can read/write events or contacts.

---

### 6.2 — Event Detail Tabs — COMPLETE (branch: `feat/stage-6.2-event-tabs`)

#### DB Migrations
- **Migration 022** — adds fields needed for event detail tabs:
  - `event_invitees`: `needs_transport boolean DEFAULT false`, `transport_by uuid REFERENCES event_invitees(id)`
  - `event_equipment`: `label text`, `is_arranged boolean DEFAULT false`
- **Migration 023** — `contacts.can_drive boolean DEFAULT false` — marks contacts who can help with transport; used to populate the "Who is driving?" picker

#### New tab components (`src/pages/Events/tabs/`)
- **`InviteesTab`** — full guest list management:
  - Add guests from contacts (two-step confirm with brings + transport toggles) or free-form (all fields)
  - Edit button on each row — pre-fills all fields; name locked for contact-linked invitees
  - Confirmed toggle (green checkmark) and needs-transport toggle (bus icon) per row
  - "Who is driving?" dropdown — shows only contacts marked `can_drive = true` who are also invitees
  - Red card border + "No driver assigned" label when transport is needed but no driver selected
  - Summary badges: confirmed count, total people, needs-transport count
  - Sheets: bottom-sheet on mobile, centered modal on desktop (`sm:items-center`)
- **`EquipmentTab`** — equipment checklist:
  - Add items with type (Chairs / Tables / Other), optional custom label, quantity, notes
  - Arranged checkbox per item (strikethrough when arranged)
  - Summary: arranged count + per-type quantity totals
- **`RecipesTab`** — recipe attachment:
  - Search and attach recipes; servings override per recipe (defaults to total people)
  - Inline servings stepper on each attached recipe card
  - Dessert / main course split sections; dessert toggle per recipe
  - **"Generate Shopping List"** button — scales all recipe ingredients to their overridden servings, merges same product+unit pairs, creates a new shopping list, and links it to the event
- **`ShoppingTab`** — shopping list linking:
  - Link existing active lists or create a new list (auto-named "Shopping — [Event]")
  - Item count per linked list; direct navigation link to list detail
  - Unlink button

#### EventsPage updates
- Query now fetches `event_invitees(party_size)` — event cards show a people count badge when guests have been added

#### ContactsPage updates
- Add/edit form has a **"Can drive"** Car toggle — stored as `contacts.can_drive`
- Contact cards show a blue "Can drive" badge when set
- On edit save, syncs `name`, `phone`, `party_size` to all `event_invitees` rows linked via `contact_id` — editing a contact propagates to all events they've been invited to

#### New helpers (`src/lib/eventHelpers.ts`)
- `inviteeSummary(invitees)` — `{ confirmed, total, totalPeople, needsTransport }`
- `equipmentSummary(items)` — `{ arranged, total, byType }`
- `scaleQty(qty, baseServings, overrideServings)` — scales ingredient quantity, rounds to 2dp

#### i18n
Added keys in both `he` and `en` under `events.*`:
- `invitees.*` — add, edit, fromContacts, newGuest, bringsPlaceholder, confirmedCount, peopleCount, transportCount, noDriver, addError, editError, deleteError, emptyHint
- `equipment.*` — add, addItem, type, label, labelPlaceholder, quantity, notes, arrangedCount, empty, emptyHint, addError, deleteError
- `recipes.*` — attach, attachRecipe, searchPlaceholder, noResults, defaultServings, changeRecipe, servings, markDessert, mainCourses, desserts, recipeCount, empty, listGenerated, listGenerateError, addError, removeError
- `shoppingTab.*` — linkList, newList, noListsAvailable, unnamedList, listCount, itemCount, empty, listCreated, linkError, unlinkError, createError
- `contacts.canDrive`

#### Tests (`src/__tests__/eventLogic.test.ts`) — 25 tests (12 new)
- `inviteeSummary()`: empty list, confirmed count, party size sum, transport count
- `equipmentSummary()`: empty list, arranged count, byType quantity sum
- `scaleQty()`: scale up, scale down, identity, rounding, zero base guard

### ⚠️ Required before testing 6.2
Run `supabase db push` — migrations 022 and 023 must be applied.

### Manual Testing Checklist — Stage 6.2
- [ ] **Apply migrations**: `supabase db push` → confirm 022 and 023 show as applied
- [ ] **Invitees tab** → empty state shown; tap "Add Guest"
- [ ] **Add from contacts** → select contact → confirm step shows brings field + confirmed/transport toggles → Add → invitee appears with correct name/party size
- [ ] **Add new guest** → fill all fields including brings → Add → appears with brings shown
- [ ] **Edit invitee** → pencil → change brings/confirmed → Save → card updates
- [ ] **Transport: no driver** → toggle bus icon on an invitee → card turns red with "No driver assigned"
- [ ] **Transport: assign driver** → mark a contact as "can drive" → add them as invitee → red invitee now shows driver dropdown with that contact → select driver → red clears
- [ ] **Confirmed toggle** → green checkmark appears; summary badge updates
- [ ] **People count on event card** → add invitees → return to Events list → card shows people badge
- [ ] **Equipment tab** → add a chair item (qty 4) and a table item → summary shows type counts
- [ ] **Arrange equipment** → tap checkbox → item gets strikethrough; arranged count updates
- [ ] **Recipes tab** → attach a recipe → servings stepper works → mark one as dessert → splits into sections
- [ ] **Generate shopping list** → attach 2 recipes → tap "Generate Shopping List" → new list created in Shopping tab → open list → ingredients present with scaled quantities
- [ ] **Shopping tab** → link an existing list → item count shown → navigate to list via arrow
- [ ] **Contacts: can drive** → edit a contact → toggle "Can drive" → save → blue badge appears on contact card
- [ ] **Contact sync** → edit contact name/party size → open an event where they're invited → invitee row reflects the updated name/party size

---

### 6.3 — Host Equipment Inventory — COMPLETE (branch: `feat/host-inventory-profile`)

#### No DB Migration
- `host_inventory` table already existed from migration 019 (`item_type`, `label`, `quantity_owned`, UNIQUE(owner_id, item_type))
- RLS policies already in place (owner-only)

#### ProfilePage — Host Equipment card
- New card in ProfilePage between Dark Mode and Manage Contacts
- 6 fixed item types: Chairs, Dining Tables, Plates, Bowls, Cold Drink Glasses, Hot Drink Cups
- Read mode: 2-column grid showing current quantities (fetched via `useQuery(['host-inventory', user.id])`)
- Edit mode: toggled via "Edit" button — steppers (+/−, min 0) per item; Save/Cancel buttons
- Save: batch upserts all 6 rows at once via `onConflict: 'owner_id,item_type'`
- First use of TanStack Query in ProfilePage

#### EquipmentTab — Host Inventory Deduction
- Extended item type picker: added Plates, Bowls, Cold Drink Glasses, Hot Drink Cups (was chair/table/other only)
- Loads host inventory via `useQuery(['host-inventory'])` (RLS returns only own rows)
- **Host Inventory summary panel** (blue box, top of tab) — appears when event has any equipment items:
  - Per type: `{type}: need X | have Y` + ` | still need Z` when gap > 0
  - Green badge when fully covered; amber when gap remains
- **Inline "You have X" badge** on each item row when host owns > 0 of that type
- Deduction: `stillNeed = Math.max(0, quantity_needed - quantity_owned)`

#### i18n
- `common.json`: added `profile.hostInventory.*` (title, description, 6 item labels, saved) — both `he` + `en`
- `events.json`: added `checklist.types.plate/bowl/cold_glass/hot_cup` and `equipment.hostInventory/owned/stillNeed` — both `he` + `en`

#### Tests
- 114 existing tests all pass; no regressions

### ⚠️ No migration needed for 6.3
`host_inventory` table was created in migration 019. Just pull and run the app.

---

## Stage 6.7 + 4.7 — Contacts Enhancements & Contact-Based Sharing — COMPLETE (branch: `feat/contacts-enhancements`, PR #34)

### What was built

#### Migration 024 — `supabase/migrations/024_contacts_label_email.sql`
- `contacts.label text CHECK (label IN ('family', 'friend'))` — nullable, marks relationship type
- `contacts.email text` — stores the contact's email for display and account-linking

#### ContactsPage (`src/pages/Events/ContactsPage.tsx`)
**Label toggle (6.7.1)**
- Three-way pill row in ContactForm: None / Family / Friend
- Colored badge on each ContactRow: amber for Family, teal for Friend

**Filter bar (6.7.1)**
- Pill row at top of page: All / Family / Friend — filters the visible list client-side
- Hidden when the contacts list is empty

**Email + account linking (6.7.2)**
- New Email field in ContactForm (below Phone)
- On save: calls `find_user_by_email` RPC (migration 005) with the entered email
  - Found → writes `linked_user_id`, shows "Account linked ✓" inline
  - Not found → clears `linked_user_id`, shows "No account with this email yet"
- ContactRow: purple "Linked" chip when `linked_user_id` is set; email shown in grey below name when stored but no account found

#### ContactPicker component (`src/components/ContactPicker.tsx`)
- Reusable chip row rendered inside any share dialog
- Own label filter pills (All / Family / Friend)
- Each chip: name + chain-link icon if `linked_user_id` is set
- Linked contacts use the stored email to resolve the share target; unlinked contacts use `contact.email`
- Contacts without an email are dimmed and non-tappable (tooltip explains why)
- Contacts whose `linked_user_id` is already a member appear dimmed
- Returns `null` if the user has no contacts (no UI noise)

#### ShareListDialog (`src/pages/Lists/ShareListDialog.tsx`) — 4.7 integration
- ContactPicker inserted between the members list and the email input
- Tapping a chip auto-fills the email field; user can then tap "Add" as usual
- Already-added members are excluded from the picker

#### Types & i18n
- `database.ts`: `contacts` Row / Insert / Update updated with `label` and `email`
- `en/events.json` + `he/events.json`: added `contacts.label`, `contacts.labelFamily`, `contacts.labelFriend`, `contacts.labelNone`, `contacts.filterAll`, `contacts.email`, `contacts.emailPlaceholder`, `contacts.linked`, `contacts.linkSuccess`, `contacts.linkNotFound`
- `en/shopping.json` + `he/shopping.json`: added `sharing.contactsSection`

### ⚠️ DB migration required
Run `supabase db push` (or apply migration 024 via the Supabase dashboard) before using the new label and email fields.

### Tests
- 114 tests pass, lint clean, format clean

---

## Collaboration & Permissions Upgrade — COMPLETE (branch: `feat/collab-permissions-upgrade`, PR #45)

### What was built

#### Migration 026 — `supabase/migrations/026_collab_upgrade.sql`
- **Attribution + concurrency on `shopping_items`** — added `updated_at`, `last_edited_by`, `last_edited_at`, `completed_by`, `completed_at` columns; trigger stamps `updated_at` on every update; backfill sets pre-existing rows to `updated_at = created_at`, `last_edited_by = added_by`
- **Soft delete on `shopping_lists`** — added `deleted_at` and `deleted_by` columns; index on `(owner_id, deleted_at) WHERE deleted_at IS NOT NULL`; keeps `is_archived` separate (archive = hide, trash = terminal)
- **`list_member_role(p_list_id)` helper** — `SECURITY DEFINER` RPC returning `'owner'|'editor'|'viewer'|null` for the calling user; used by RLS policies and client hook
- **RLS hardening** — `shopping_items` INSERT/UPDATE/DELETE now require `list_member_role(list_id) IN ('owner','editor')` (viewers read-only); `shopping_lists` SELECT excludes soft-deleted rows for non-owners
- **Column-level write guard** — `aa_shopping_lists_column_guard` BEFORE UPDATE trigger blocks editor writes to owner-only columns (`is_archived`, `deleted_at`, `deleted_by`, `owner_id`, `is_missing_list`)
- **`find_user_by_email` hardened** — new 2-arg signature `(p_email, p_list_id)` requiring caller to be list owner; eliminates user-enumeration vector

#### Migration 027 — `supabase/migrations/027_notifications.sql`
- **`notifications` table** — `recipient_user_id`, `actor_user_id`, `list_id`, `entity_type`, `entity_id`, `notification_type` (11 types), `payload jsonb`, `created_at`, `read_at`; RLS: recipient can read/update/delete; INSERT only via SECURITY DEFINER triggers
- **Fan-out triggers** — AFTER INSERT/UPDATE on `shopping_items`, AFTER UPDATE on `shopping_lists`, AFTER INSERT/UPDATE/DELETE on `list_members` — each calls `notify_list_recipients()` which fans out to all members excluding the actor
- **`purge_trashed_lists()` RPC** — fallback for `pg_cron` if not enabled; purges lists where `deleted_at < now() - interval '30 days'`

#### New hooks and libs
- **`src/hooks/useListRole.ts`** — wraps `list_member_role` RPC with `staleTime: 30_000`; exports `canEdit(role)` (owner|editor) and `canOwn(role)` (owner only)
- **`src/hooks/useNotifications.ts`** — last-20 notifications query, unread count query, `markReadMutation`, `markAllReadMutation`, `deleteNotificationMutation`; Realtime subscription on `notifications` filtered by `recipient_user_id`
- **`src/lib/lists.ts`** — `softDeleteList`, `restoreList`, `purgeList`, `leaveList`, `countCollaborators`
- **`src/lib/undo.ts`** — `UndoableAction` discriminated union (`item_add`, `item_remove`, `item_quantity`, `item_toggle`); `showUndoToast(action, label)` with 10s window, staleness guard (skips reverse if `updated_at` advanced), sonner action button

#### New components and pages
- **`src/components/DeleteListDialog.tsx`** — shows collaborator count from `countCollaborators`; "Move to Trash" calls `softDeleteList`; disabled "Transfer ownership (coming soon)" chip
- **`src/components/CollaboratorsDialog.tsx`** — read-only member list with role badges; "Leave list" button for non-owners; two-step confirm calls `leaveList`; navigates to `/lists` on success
- **`src/components/NotificationBell.tsx`** — bell icon with unread badge (capped at "9+"); click-outside detection; renders `NotificationsPanel` when open
- **`src/components/NotificationsPanel.tsx`** — last-20 notifications, `notificationText()` using i18n type key, unread dot, mark-all-read button, click navigates to list
- **`src/pages/Lists/TrashPage.tsx`** — owner's soft-deleted lists with `formatDistanceToNow(deleted_at)`; restore via `restoreList`; purge via `purgeList` with confirm dialog

#### Updated files
- **`src/pages/Lists/ListDetailPage.tsx`** — role gating (`isEditor`, `isOwner`); stale-state redirect (list returns 0 rows after access revoked → navigate to `/lists` with toast); last-edited attribution (`last_edited_by ?? added_by`); FAB gated to editors; delete button (owner only) → `DeleteListDialog`; collaborators button for non-owners → `CollaboratorsDialog`; undo toasts on toggle, remove, and add-item mutations
- **`src/pages/Lists/ListsPage.tsx`** — active and archived queries filter `deleted_at IS NULL`; Trash nav link added
- **`src/pages/Lists/ShareListDialog.tsx`** — `find_user_by_email` call now passes `p_list_id` (security hardening)
- **`src/components/layout/Header.tsx`** — `NotificationBell` mounted in right-side button group
- **`src/App.tsx`** — `/lists/trash` route added before `/lists/:id`

#### i18n
- `shopping.json` (both `he` and `en`): `sharing.viewCollaborators`, `sharing.collaboratorsTitle`, `sharing.roleOwner/Editor/Viewer`, `sharing.leaveList`, `sharing.leaveConfirm*`, `sharing.noAccess`, `sharing.lastEditedBy`; `trash.*` section; `deleteList.*` section; `undo.*` section; `lists.trashLink`
- `common.json` (both `he` and `en`): `notifications.*` section (title, empty, markAllRead, 11 notification type strings)

#### Tests — `src/__tests__/collabLogic.test.ts` (26 tests)
- `canEdit` / `canOwn` for all role values including null/undefined
- `UndoableAction` discrimination switch
- Undo staleness guard (equal timestamps → not stale; different → stale)
- Soft-delete and restore payload shapes
- Notification fan-out exclusion (actor excluded, all others included, solo-actor → empty)
- `canLeave` (owner cannot, editor/viewer can, null role cannot)

### ⚠️ Required before testing
Run `supabase db push` — migrations 026 and 027 must be applied before the new role gating, notifications, trash, and undo flows will work.

---

## Dark Mode — COMPLETE (branch: `feat/dark-mode`, pending merge)

### Approach
- Tailwind `darkMode: ['class']` was already configured — activates via `class="dark"` on `<html>`
- `dark:` prefix overrides added alongside existing classes (no full CSS variable refactor)
- Toggle in ProfilePage (moon/sun icon), persisted to localStorage, defaults to OS `prefers-color-scheme`
- FOUC prevention script planned for `index.html`

### Completed
1. `src/index.css` — `.dark { --background: ...; --foreground: ...; }` block added
2. `src/store/useAppStore.ts` — `isDarkMode` + `toggleDarkMode` added, persisted to localStorage
3. `src/App.tsx` — `useEffect` applies/removes `dark` class on `<html>`
4. `src/pages/Profile/ProfilePage.tsx` — dark mode toggle card (sun/moon) + all elements updated
5. `src/components/layout/AppLayout.tsx` — `dark:bg-gray-950` added
6. `src/components/layout/Header.tsx` — full dark mode coverage
7. `src/components/layout/BottomNav.tsx` — full dark mode coverage
8. `src/pages/Auth/AuthPage.tsx` — full dark mode coverage (refactored repeated input/label classes)
9. `src/pages/Lists/ListsPage.tsx` — full dark mode coverage
10. `src/pages/Lists/ListDetailPage.tsx` — full dark mode coverage (items, sheets, dialogs, nav)
11. `src/pages/Lists/ShareListDialog.tsx` — full dark mode coverage
12. `src/pages/Products/ProductsPage.tsx` — full dark mode coverage (sticky search bar, import button, category chips, group badges, ImportSummaryDialog, AddToListSheet list buttons + empty text)
13. `src/pages/Recipes/RecipesPage.tsx` — full dark mode coverage (RecipeCard, ConfirmDeleteDialog, search bar, tool filter chips, empty/loading states)
14. `src/pages/Recipes/RecipeDetailPage.tsx` — full dark mode coverage (header, title/description, meta row, servings spinner, tools, ingredients section, substitutes, steps, ConfirmDeleteDialog, AddToListSheet)
15. `src/pages/Recipes/RecipeFormPage.tsx` — **PARTIALLY DONE** (ProductSearchSheet done; IngredientRow and main form body still need dark: classes)
16. i18n — added `profile.darkMode` / `profile.lightMode` keys in both `he` and `en`

### Completed
All pages done. 63 tests pass, lint clean. Branch ready to merge to `main`.

### Color Mapping Reference
| Light class | Dark addition |
|---|---|
| `bg-white` | `dark:bg-gray-900` (top-level cards) or `dark:bg-gray-800` (nested) |
| `bg-gray-50` | `dark:bg-gray-950` or `dark:bg-gray-900` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `bg-gray-200` | `dark:bg-gray-700` |
| `text-gray-900/800` | `dark:text-gray-100` |
| `text-gray-700` | `dark:text-gray-300` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500/400` | `dark:text-gray-400/500` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-100` | `dark:border-gray-800` |
| `hover:bg-gray-100` | `dark:hover:bg-gray-800` |
| `hover:bg-gray-50` | `dark:hover:bg-gray-800` |
| inputs | `dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500` |
| selects | `dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200` |

