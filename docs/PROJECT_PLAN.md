# Shopping · Recipes · Events — Project Plan
> **Version:** 1.0 | **Date:** April 2026 | **Owner:** Sivan Becker

---

## Project Overview

A full-stack web application (mobile-first, responsive) that layers three core domains:
1. **Shopping Lists** — inspired by the Bring! Grocery Shopping List app
2. **Recipes** — with ingredient management and shopping-list integration
3. **Family/Social Events** — guests, transport, resources, countdowns

The app supports real-time collaboration between a small group of users (family/friends). UI supports both Hebrew (RTL) and English (LTR).

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Fast DX, strong type safety |
| **UI Framework** | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| **Server State** | TanStack Query (React Query) v5 | Caching, background refetch |
| **Client State** | Zustand | Lightweight UI state (filters, language, etc.) |
| **Routing** | React Router v6 | SPA client-side routing |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Internationalization** | i18next + react-i18next | Hebrew (RTL) + English (LTR) |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime + Edge Functions |
| **Authentication** | Supabase Auth | Email + password, Google OAuth, JWT sessions |
| **Realtime** | Supabase Realtime Channels | Live collaborative list updates |
| **Hosting — Frontend** | Vercel | Auto-deploy from GitHub |
| **Hosting — Backend/DB** | Supabase Cloud | Free tier sufficient for small group |
| **Unit Tests** | Vitest + React Testing Library | Component and hook tests |
| **E2E Tests** | Playwright | Critical user flow coverage |
| **CI** | GitHub Actions | Tests run on every PR |

---

## Database Schema (Supabase / PostgreSQL)

### Auth & Profiles
```sql
profiles           (id, user_id FK, display_name, preferred_language, created_at)
```

### Shopping Layer
```sql
categories         (id, name_he, name_en, icon, color, sort_order)
unit_types         (id, code, label_he, label_en, type[weight|volume|count|cooking])
products           (id, name_he, name_en, category_id FK, default_unit_id FK,
                    created_by FK, is_shared BOOL)

shopping_lists     (id, name, owner_id FK, is_active BOOL, is_archived BOOL,
                    is_missing_list BOOL, created_at, updated_at)
list_members       (id, list_id FK, user_id FK, role[owner|editor|viewer])
shopping_items     (id, list_id FK, product_id FK, quantity DECIMAL, unit_id FK,
                    is_checked BOOL, added_by FK, recipe_id FK nullable,
                    note TEXT, sort_order INT, created_at)
```

### Recipes Layer
```sql
recipes            (id, title, description, servings INT, prep_time_minutes INT,
                    tools TEXT[], owner_id FK, is_shared BOOL, created_at)
recipe_ingredients (id, recipe_id FK, product_id FK, quantity DECIMAL,
                    unit_id FK, note TEXT, substitute_group_id INT nullable,
                    sort_order INT)
recipe_steps       (id, recipe_id FK, step_number INT, description TEXT)
```

### Events Layer
```sql
events             (id, title, date TIMESTAMPTZ, location TEXT,
                    owner_id FK, notes TEXT, created_at)
event_members      (id, event_id FK, user_id FK, role[owner|editor|viewer])
event_guests       (id, event_id FK, name TEXT, phone TEXT,
                    needs_transport BOOL, transport_by_guest_id FK nullable,
                    confirmed BOOL, brings TEXT)
event_items        (id, event_id FK, type[chair|table|recipe|other],
                    label TEXT, quantity INT, assigned_to_guest_id FK nullable,
                    is_arranged BOOL, notes TEXT)
event_recipes      (id, event_id FK, recipe_id FK, servings_override INT)
event_shopping_lists (id, event_id FK, list_id FK)
```

---

## Design System & UI Principles

- **Color palette:** Warm, friendly — inspired by Bring! (oranges, greens, clean whites)
- **Typography:** Rubik — supports Hebrew and Latin scripts perfectly
- **Icons:** Lucide React — consistent and lightweight icon set
- **RTL Support:** Full RTL for Hebrew via `dir="rtl"` on `<html>` + Tailwind RTL plugin
- **Mobile-first:** All layouts designed for 375px, then tablet and desktop breakpoints
- **Mobile navigation:** Bottom tab bar (Lists / Recipes / Events / Profile)
- **Dark mode:** Post-MVP — not in scope for v1

---

---

# Implementation Stages

---

## STAGE 0 — Project Scaffolding & Infrastructure
> **Goal:** A runnable project skeleton with CI/CD, linting, testing setup, routing, and i18n.
> **Estimated time:** 2–3 days

### Tasks

#### 0.1 — Initialize Repository & Tooling
- [ ] Create GitHub repository, set `main` as a protected branch
- [ ] Bootstrap with `npm create vite@latest` — select React + TypeScript template
- [ ] Configure ESLint + Prettier + Husky pre-commit hooks
- [ ] Configure `tsconfig.json` with strict mode enabled
- [ ] Add path aliases: `@/` maps to `src/`

#### 0.2 — Install & Configure UI Stack
- [ ] Install Tailwind CSS v3 + PostCSS + RTL plugin (`tailwindcss-rtl`)
- [ ] Install shadcn/ui, run `shadcn-ui init`
- [ ] Add base components: Button, Input, Dialog, Card, Badge, Skeleton, Toast
- [ ] Set up Rubik font (Google Fonts or self-hosted for performance)
- [ ] Create `theme.ts` with brand color tokens

#### 0.3 — Routing Setup
- [ ] Install React Router v6
- [ ] Define route tree:
  - `/auth` — login/register
  - `/lists` — shopping lists overview
  - `/lists/:id` — list detail
  - `/products` — product catalog
  - `/recipes` — recipes overview
  - `/recipes/:id` — recipe detail
  - `/events` — events overview
  - `/events/:id` — event detail
  - `/profile` — user profile
- [ ] Create placeholder page components for each route
- [ ] Add `<ProtectedRoute>` wrapper — redirects to `/auth` if no active session

#### 0.4 — i18n Setup (Hebrew + English)
- [ ] Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- [ ] Create `/locales/he.json` and `/locales/en.json` with namespaces: `common`, `shopping`, `recipes`, `events`
- [ ] Dynamically set `<html dir="rtl" lang="he">` or `<html dir="ltr" lang="en">` based on active language
- [ ] Build a language switcher component (He | En) in the app header
- [ ] Verify RTL layout renders correctly with a sample form

#### 0.5 — Supabase Project Setup
- [ ] Create Supabase project in the cloud dashboard
- [ ] Add `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Install `@supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts` as a singleton client
- [ ] Enable Row Level Security (RLS) on all tables from day one
- [ ] Write the initial migration: `profiles` table only

#### 0.6 — State & Data Fetching Setup
- [ ] Install TanStack Query v5 + Zustand
- [ ] Wrap app with `<QueryClientProvider>`
- [ ] Create `useAuth` hook — wraps Supabase session state
- [ ] Create `useAppStore` Zustand store skeleton (language, UI flags)

#### 0.7 — Testing Infrastructure
- [ ] Install Vitest + @testing-library/react + @testing-library/user-event
- [ ] Install Playwright + configure `playwright.config.ts`
- [ ] Write first smoke test: `<App />` renders without errors
- [ ] Write first E2E test: navigate to `/auth`, login form is visible
- [ ] Set up GitHub Actions workflow: lint + unit tests on PR; E2E on push to `main`

#### 0.8 — Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Confirm preview deployments work per branch

#### Stage 0 Manual Testing Checklist
- [ ] App loads at `localhost:5173` without console errors
- [ ] All routes render their placeholder pages
- [ ] Language switch between Hebrew and English works; RTL flips layout direction
- [ ] `npm run test` passes all unit tests
- [ ] `npm run test:e2e` smoke test passes
- [ ] Vercel preview URL is live and accessible

---

## STAGE 1 — Authentication & User Profiles
> **Goal:** Users can register, log in, log out, and manage their profile.
> **Estimated time:** 2–3 days

### Tasks

#### 1.1 — Supabase Auth Migration
- [ ] Create `profiles` table migration
- [ ] Add database trigger: on `auth.users` insert → auto-create `profiles` row
- [ ] RLS policies: users can read and update only their own profile

#### 1.2 — Auth Pages (Login / Register)
- [ ] Build `/auth` page with "Login" / "Register" tabs
- [ ] Login form: email + password, Zod validation
- [ ] Register form: display name + email + password + confirm password
- [ ] Wire up Supabase `signInWithPassword` and `signUp`
- [ ] Show loading states and error messages via Toast
- [ ] Redirect to `/lists` on successful authentication
- [ ] "Forgot password" link → calls Supabase `resetPasswordForEmail`

#### 1.3 — Auth State Management
- [ ] Create `AuthProvider` context listening to `supabase.auth.onAuthStateChange`
- [ ] `useAuth` hook returns `{ user, profile, loading, signOut }`
- [ ] `ProtectedRoute` uses `useAuth` — redirects unauthenticated users

#### 1.4 — Profile Page
- [ ] `/profile` page: display name, email, preferred language
- [ ] Edit display name inline form
- [ ] Language switch saves to `profiles.preferred_language`
- [ ] Sign out button

#### Stage 1 Manual Testing Checklist
- [ ] Register a new user → `profiles` row is created in the database
- [ ] Login with correct credentials → redirects to `/lists`
- [ ] Login with wrong password → clear error message shown
- [ ] Refresh the page while logged in → session persists
- [ ] Sign out → redirects to `/auth`
- [ ] Accessing protected routes while logged out → redirect to `/auth`
- [ ] Forgot password email arrives and password reset works

#### Automated Tests
- [ ] Unit: `useAuth` hook returns correct user state
- [ ] Unit: Zod schemas reject invalid email or weak password
- [ ] E2E: Full register → login → sign out flow

---

## STAGE 1.5 — Social Login (Google OAuth)
> **Goal:** Allow users to sign in with their Google account for frictionless onboarding.
> **Estimated time:** 1 day

### Tasks

#### 1.5.1 — Supabase Google Provider Setup
- [ ] Enable Google OAuth provider in Supabase Dashboard (Authentication → Providers → Google)
- [ ] Create OAuth credentials in Google Cloud Console (OAuth 2.0 Client ID)
- [ ] Add Google Client ID and Client Secret to Supabase provider settings
- [ ] Configure the authorized redirect URI from Supabase in Google Cloud Console (should be `{your-app-url}/auth`)

#### 1.5.2 — Google Sign-In Button
- [ ] Add `GoogleIcon` SVG component (`src/components/icons/GoogleIcon.tsx`)
- [ ] Add "Continue with Google" button to AuthPage above login/register tabs
- [ ] Call `supabase.auth.signInWithOAuth({ provider: 'google' })` with redirect to `/lists`
- [ ] Add "or" divider between Google button and email/password forms
- [ ] Style with standard Google branding (white bg, Google "G" icon, dark text)

#### 1.5.3 — i18n
- [ ] Add `auth.continueWithGoogle` and `auth.orDivider` keys in Hebrew and English

#### Stage 1.5 Manual Testing Checklist
- [ ] "Continue with Google" button is visible on both Login and Register views
- [ ] Button is hidden on the Forgot Password view
- [ ] Clicking the button redirects to Google's OAuth consent screen
- [ ] After Google consent, user is redirected back to `/lists` with an active session
- [ ] A `profiles` row is auto-created for the new Google user
- [ ] RTL layout (Hebrew) renders the button and divider correctly
- [ ] Dark mode renders the button correctly
- [ ] Button is disabled when Supabase is not configured

---

## STAGE 2 — Products Catalog
> **Goal:** A shared catalog of products with categories and unit types — the foundation for shopping and recipes.
> **Estimated time:** 3–4 days

### Tasks

#### 2.1 — DB Migration: Products
- [ ] Create `categories`, `unit_types`, and `products` tables
- [ ] Seed `unit_types`: units, grams, kilograms, milliliters, liters, teaspoon, tablespoon, cup, half-teaspoon, two tablespoons, container, etc.
- [ ] Seed `categories`: Fruits & Vegetables, Meat & Fish, Dairy, Bread & Bakery, Canned Goods, Cleaning, Frozen, Other
- [ ] RLS: all authenticated users can read products and categories; users can only update/delete their own products

#### 2.2 — Products Management UI
- [ ] `/products` page — product grid grouped by category
- [ ] Live search bar (filters by product name)
- [ ] Category filter chips
- [ ] "Add Product" button — opens a dialog
- [ ] Add Product form: Hebrew name, English name, category, default unit
- [ ] Edit product (pencil icon per card)
- [ ] Delete product (trash icon + confirmation dialog)

#### 2.3 — Shared vs. Personal Products
- [ ] `is_shared` flag — shared products are visible to all users
- [ ] Personal products are visible only to their creator
- [ ] Seed a set of global shared products (common Israeli supermarket items)

#### 2.4 — Category Display
- [ ] Products grid shows category color and icon
- [ ] Category names adapt to current language (Hebrew or English)

#### 2.5 — Bulk Import from CSV / JSON (Frontend) — COMPLETE

**File format**
```
name_he,name_en,category,default_unit
חלב,Milk,Dairy,liter
לחם,Bread,Bakery,unit
```
- Both `.csv` and `.json` (array of objects with same field names) are accepted.
- `name_he` is required; all other fields are optional.
- `category` matches by Hebrew name, English name (case-insensitive).
- `default_unit` matches by code, English label, or Hebrew label (case-insensitive).
- Unresolved category or unit → field stored as `null` (row is still imported).

**Row classification**
Each row is classified as one of:
| Outcome | Reason key | Description |
|---|---|---|
| ✓ inserted | — | New product, all fields valid |
| ✓ updated | — | Duplicate name but other props differ — updates existing product |
| ✗ skipped | `missingNameHe` | `name_he` is empty or missing |
| ✗ skipped | `unchanged` | Duplicate name and no props changed |

**Upsert logic (duplicate name handling)**
When a row's `name_he` (or `name_en`) matches an existing product:
1. Compare the incoming `category_id` and `default_unit_id` against the existing product.
2. If anything differs → `UPDATE` the existing product with the new values (upsert).
3. If nothing differs → skip with reason `unchanged`.
Only the owner's own products are updated; shared products are never mutated by import.

**Result summary dialog**
Shows counts: "X inserted, Y updated, Z skipped" with a per-row reason list for skipped rows.
Skipped rows are downloadable as a CSV for correction and re-import.

**Key files**
- `src/lib/importProducts.ts` — `parseImportFile`, `resolveCategory`, `resolveUnit`, `skippedRowsToCsv`
- `src/pages/Products/ProductsPage.tsx` — Import button, `handleFileChange`, `ImportSummaryDialog`
- `src/locales/*/common.json` — `products.import.*` keys

#### 2.6 — Bulk Import: Upsert on Duplicate — COMPLETE
- [x] On duplicate `name_he` or `name_en`: compare incoming props against existing product
- [x] If props differ → `UPDATE` existing product (`category_id`, `default_unit_id`, `name_en`)
- [x] If props identical → skip with reason `unchanged`
- [x] Only the owner's own products can be updated via import
- [x] Summary dialog shows separate inserted / updated / skipped counts
- [x] Unit tests cover: upsert triggers update, identical row is skipped, owner-only guard

#### 2.7 — Add Product to Shopping List (from Products Page)
- [ ] Each product card on `/products` has an "Add to list" icon button (`ListPlus`)
- [ ] Tapping it opens a bottom sheet with:
  - List of the user's active (non-archived) shopping lists
  - Quantity stepper (count units) or free input (weight/volume) pre-set to 1
  - Unit chips filtered to the product's unit category
  - "New List" option that creates a new active list on the fly
- [ ] Selecting a list upserts: bumps quantity if the product is already in that list (unchecked), otherwise inserts it
- [ ] Toast confirms "Added to [list name]" with a tappable link to navigate to that list

#### 2.8 — AI Auto-Suggest for Product Fields (Gemini Flash)
- [ ] Supabase Edge Function `suggest-product` — receives Hebrew product name + categories + unit_types lists, calls Gemini Flash API, returns `{ name_en, category_id, default_unit_id }`
- [ ] `GEMINI_API_KEY` stored as Supabase secret (free tier from [Google AI Studio](https://aistudio.google.com/apikey))
- [ ] ProductDialog (add mode): sparkle/wand button next to Hebrew name field triggers AI suggestion
- [ ] On success: pre-fills English name, category, and default unit (user can override before saving)
- [ ] On failure: silent — fields stay empty, manual entry as before
- [ ] i18n: `products.suggest`, `products.suggesting` in both `he` and `en`

**Architecture:**
- Frontend sends Hebrew name + cached categories/units arrays to the edge function (no extra DB call)
- Edge function calls `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Prompt includes the exact category IDs and unit IDs so the AI picks from the app's real options
- AddItemSheet (quick-add) is unchanged — AI suggest is only in the full ProductDialog

**Key files:**
- `supabase/functions/suggest-product/index.ts` — Edge Function
- `src/pages/Products/ProductsPage.tsx` — ProductDialog suggest button + logic

**Setup:** `supabase secrets set GEMINI_API_KEY=...` then `supabase functions deploy suggest-product`

#### Stage 2 Manual Testing Checklist
- [ ] Add a product → it appears in the list immediately
- [ ] Search bar filters results correctly in real time
- [ ] Category filter works correctly
- [ ] Edit product name → change persists after page refresh
- [ ] Delete product → confirmation dialog appears, then product is removed
- [ ] Hebrew product names display correctly (RTL context)
- [ ] English names display correctly (LTR context)
- [ ] Import a valid CSV → all rows appear in the product list
- [ ] Import a CSV with some invalid rows → summary shows correct counts; skipped-rows CSV is downloadable
- [ ] Import a JSON file → products appear correctly
- [ ] Unknown category or unit in CSV → row is imported with null category/unit (not skipped)
- [ ] Import a row matching an existing name with different category → existing product is updated
- [ ] Import a row identical to an existing product → skipped with "unchanged" reason

#### Automated Tests
- [x] Unit: search filter function filters correctly (empty, partial He/En, case-insensitive, null name)
- [x] Unit: `ProductCard` name display logic (he/en, null fallback, owner detection)
- [x] Unit: `resolveCategory` — Hebrew name, English name (case-insensitive), unknown, undefined
- [x] Unit: `resolveUnit` — code, English label, Hebrew label, unknown, undefined
- [x] Unit: `parseImportFile` CSV — valid row, missing `name_he`, unknown category/unit, mixed rows
- [x] Unit: `parseImportFile` CSV — duplicate `name_he` in DB skipped, duplicate `name_en` in DB skipped
- [x] Unit: `parseImportFile` — deduplication within the file itself
- [x] Unit: `parseImportFile` JSON — valid array, non-array throws, missing `name_he`, duplicate
- [x] Unit: upsert — duplicate with changed props triggers update, identical row skipped as `unchanged`
- [ ] E2E: Add product → verify it appears → delete it → verify it is gone

---

## STAGE 3 — Shopping Lists (Core)
> **Goal:** Full shopping list management — create, add items with quantities, check off items, archive, and clone lists.
> **Estimated time:** 5–7 days

### Tasks

#### 3.1 — DB Migration: Shopping
- [ ] Create `shopping_lists`, `list_members`, and `shopping_items` tables
- [ ] RLS: list owner has full access; members access is based on role
- [ ] Add indexes: `shopping_items(list_id)`, `shopping_lists(owner_id, is_archived)`

#### 3.2 — Lists Overview Page (`/lists`)
- [ ] Active lists section — cards showing: name, creation date, item count, active badge
- [ ] "Archived" section — collapsible, shows past lists
- [ ] "New List" floating action button (FAB)
- [ ] Create list dialog: optional name (defaults to today's date if left blank)
- [ ] List card actions: tap to open, overflow menu for archive / clone / delete

#### 3.3 — List Detail Page (`/lists/:id`)
- [ ] Header: list name (editable inline), creation date, item count, active/done toggle
- [ ] "Add Item" search bar at the top — search products, tap to add
- [ ] If product not found: inline "Create new product" option
- [ ] Items grouped by category (matching Bring! visual style)
- [ ] Category section title shows the item count for that category (e.g. "Dairy (3)")
- [ ] Each item row: product name, quantity + unit, check button
- [ ] Checked items move to a "In Cart" section at the bottom — visually dimmed
- [ ] Tap quantity to edit inline; swipe or long-press for delete
- [ ] Empty state: friendly illustration + "Add your first item"

#### 3.4 — Quantity & Units UX
- [ ] Count-type units: +/− stepper buttons
- [ ] Weight/volume: free numeric input (e.g., "500") + unit picker
- [ ] Unit picker: dropdown grouped by type (Cooking Measures | Weight | Volume | Count)
- [ ] Quantity displays as: "2 units", "500 g", "3 tbsp"

#### 3.5 — Archive, Clone & Reactivate
- [ ] "Mark as Done" button on list → sets `is_archived = true`, `is_active = false`
- [ ] Archive section shows past lists with date and item summary
- [ ] "Reactivate" button on archived list
- [ ] "Clone" button → creates a new active list with same items (quantities unchanged, nothing checked)

#### 3.6 — "Missing Items" Quick-Add Flow
- [ ] Persistent FAB or bottom sheet: "Something's missing"
- [ ] If no active "Missing Items" list exists → auto-create one with `is_missing_list = true`
- [ ] Subsequent additions go to the same list
- [ ] "Missing Items" list is pinned at the top of the lists page
- [ ] "Convert to Shopping List" button: creates a regular list from selected items or all items

#### 3.7 — Shopping Mode (In-Store UX)
- [ ] "Start Shopping" button on list detail → enters shopping mode
- [ ] Shopping mode: larger touch targets, prominent check circles
- [ ] Checked items collapse to "In Cart" section
- [ ] Progress bar: "X of Y items picked"
- [ ] "Done Shopping" button → prompts to archive the list

#### Stage 3 Manual Testing Checklist
- [ ] Create list without name → defaults to today's date
- [ ] Create list with a custom name → name shown on card and header
- [ ] Add an existing product → appears with default unit
- [ ] Add a product not in the catalog → creates product + adds it to list
- [ ] Change quantity and unit → persists on refresh
- [ ] Check an item → moves to "In Cart" section
- [ ] Uncheck an item → moves back to the main list
- [ ] Archive a list → moves to the archive section
- [ ] Clone a list → new list has all items unchecked
- [ ] Reactivate an archived list → appears in active section
- [ ] "Missing Items" flow: first item creates the list; subsequent adds go to same list
- [ ] Convert Missing Items to shopping list works correctly
- [ ] Shopping mode is usable on a real mobile screen

#### Automated Tests
- [ ] Unit: `useShoppingList` hook CRUD operations
- [ ] Unit: item grouping-by-category function
- [ ] Unit: quantity formatting for all unit types
- [ ] E2E: Create list → add 3 items → check 2 → archive → verify items in archive

---

## STAGE 4 — Real-time Sharing
> **Goal:** Multiple users can share and co-edit lists simultaneously with live updates.
> **Estimated time:** 3–4 days

### Tasks

#### 4.1 — Invite Users to a List
- [ ] "Share" button on list detail → dialog to enter a user's email
- [ ] Look up user by email in `profiles` table
- [ ] Insert row into `list_members` with role `editor`
- [ ] Display current members with role badges
- [ ] Remove member option (owner only)
- [ ] Contact picker in share dialog — see **4.7** below

#### 4.2 — Supabase Realtime Subscriptions ✅ COMPLETE
- [x] Subscribe to `shopping_items` changes (INSERT / UPDATE / DELETE) when a list is opened
- [x] Subscribe to `shopping_lists` UPDATE events (name, archived status)
- [x] Client-side list ID guard (no server-side filter — avoids walrus context issue)
- [x] Smart cache updates: DELETE removes from cache; UPDATE is_checked patches in-place; INSERT invalidates
- [x] Conflict resolution: last-write-wins via Postgres server state

**Implementation note — Realtime Broadcast workaround:**
Supabase Realtime's walrus extension evaluates RLS row-visibility checks in a Postgres context
where `auth.uid()` cannot be resolved when RLS policies do cross-table joins (our schema:
`shopping_items` → `list_members` / `shopping_lists`). Walrus silently drops events for all
subscribers. Fix: after each mutation, the mutating client sends a `broadcast` event
(`items-changed` / `list-changed`) on the shared channel; all subscribers receive it and
invalidate their React Query cache. Broadcast bypasses walrus. The subsequent data refetch is
still protected by REST-side RLS. `postgres_changes` listeners are kept in place and will work
correctly if Supabase resolves the walrus context issue in a future release.

Also: `supabase.realtime.setAuth(session.access_token)` called explicitly before subscribing
because Supabase JS v2 only syncs the JWT to Realtime on `SIGNED_IN` / `TOKEN_REFRESHED`,
not on `INITIAL_SESSION` (silent page-load restore).

#### 4.3 — Presence Indicators (deferred to 4.5)
Moved and expanded — see Stage 4.5 below.

#### 4.4 — In-App Notifications
- [ ] Toast notification when another user adds an item to a shared list you are viewing
- [ ] Unread badge on a list card when items were added while you were away

#### 4.5 — User Avatars & Shared List Social UX
> **Goal:** At-a-glance visibility of who owns a list and who it is shared with, without opening the sharing dialog. Deterministic generated avatars (no image upload required).

**Avatar generation**
- Use `boring-avatars` npm package — generates deterministic, attractive SVG avatars from a seed string (display name or user_id). No uploads, no storage, no privacy concerns.
- Avatar style: `"marble"` or `"beam"` (soft, colorful, unique per user)
- Seed: `profile.display_name ?? profile.user_id` — stable across sessions

**DB changes**
- No new columns required for phase 1. Avatar is purely client-generated from existing profile data.
- Optional future: add `avatar_style` preference to `profiles` to let users pick their avatar style.

**Where avatars appear**

| Location | What to show |
|---|---|
| Profile page header | Large avatar (48px) next to display name |
| List card (shared lists only) | Small avatar stack: owner avatar + member avatars (max 3 visible, then "+N") |
| List detail header | Same avatar stack, slightly larger; owner avatar highlighted with a ring |

**List card social row (new)**
- Shown only on lists that have `list_members` entries (i.e., shared lists)
- Renders a compact horizontal avatar stack (each avatar 24px, overlapping by 8px)
- Owner avatar always first, with a subtle colored ring to distinguish from members
- Tapping the stack still opens the ShareListDialog for full management
- No extra DB query needed — `list_members` with profile data can be joined in the existing lists query or fetched lazily per card

**List detail header social row**
- Same avatar stack (32px avatars) in the header row next to the share button
- Tooltips (or press-and-hold on mobile) show display name per avatar
- Replaces the need to open the sharing dialog just to see who has access

**Implementation plan**
1. Install `boring-avatars` package
2. Create `<UserAvatar size profileId displayName />` component — renders the SVG avatar
3. Create `<AvatarStack members />` component — renders overlapping avatar list with "+N" overflow
4. Fetch `list_members` joined with `profiles` in the lists overview query (or a separate query per list, lazy)
5. Add `AvatarStack` to list cards (shared lists only)
6. Add `AvatarStack` to list detail header
7. Add single `UserAvatar` to Profile page header

#### 4.6 — Item-Level "Added By" Avatar

> **Goal:** Each item row in a shared list shows a small avatar of the user who added it, so members know at a glance who is responsible for each item.

**Where it appears**
- Every item row in `ListDetailPage` (`/lists/:id`) — a small avatar (20px) to the right of the quantity/unit label, before the delete button
- Shown in both normal mode and shopping mode
- Tooltip on hover/press shows the display name

**Data source**
- `shopping_items.added_by` (UUID, already fetched) is cross-referenced against the `members` array already loaded in `ListDetailPage` via `useQuery(['list_members', id])` (includes owner + invited members)
- No extra DB query required

**Implementation plan**
1. Pass the `members` array into `ItemRow` props (or look it up via a prop passed from the parent)
2. Inside `ItemRow`, find `members.find(m => m.user_id === item.added_by)`
3. Render `<UserAvatar userId={item.added_by} displayName={found?.display_name} size={20} />` in the item row
4. Place avatar between quantity label and delete button

**DB changes**
- None. `added_by` is already on `shopping_items` and `members` data is already fetched.

#### 4.7 — Contact-Based Sharing Suggestions

> **Goal:** When sharing any entity (list, event), the user can pick from their named contacts instead of typing raw emails. Contacts with a linked system account are shared directly; others show their stored email as a fallback.

**UX flow — share dialog**
- Above the manual email input, render a scrollable chip-row (or inline typeahead) of the user's contacts
- Each chip shows: name, label badge (`Family` / `Friend`), and a "linked" icon if `linked_user_id` is set
- Tapping a chip:
  - If the contact has `linked_user_id` → use that user ID / their profile email directly
  - Else if the contact has a stored `email` → auto-fill the email input field
  - Else → auto-fill with nothing (user must type manually)
- The manual email input remains fully functional as a fallback for ad-hoc shares
- Filter chips in real-time as the user types in the email field (fuzzy match on name)

**Entities where contact suggestions apply**
| Entity | Where |
|---|---|
| Shopping list | `ShareListDialog` (Stage 4.1) |
| Event | Event members invite dialog (Stage 6.3) |

**DB changes**
- None beyond what is added in Stage 6.7

**Implementation notes**
- Load contacts via `useQuery(['contacts', user.id])` — already used in ContactsPage; reuse the same query key
- Component: `<ContactPicker onSelect={(contact) => …} />` — shared between list and event share dialogs
- If a contact's `linked_user_id` is set, skip email lookup and call the share mutation directly with `user_id`

#### Stage 4 Manual Testing Checklist
- [x] Open the same list on two browser tabs → add item in one → appears in the other within 1 second
- [x] Check an item in one session → immediately reflects in the other session
- [x] Invite a user by email → the list appears in their `/lists` page
- [x] Remove a user from the list → they lose access immediately
- [ ] Shared list cards show avatar stack of owner + members without opening the sharing dialog
- [ ] Owner avatar is visually distinct from member avatars (ring/highlight)
- [ ] Avatars show in list detail header; tooltips reveal display names
- [ ] Profile page shows the user's own avatar next to their display name
- [ ] Each item row shows a small avatar of the user who added it
- [ ] Avatar tooltip shows the user's display name

#### Automated Tests
- [ ] Unit: RLS policies — User A cannot read User B's private list
- [ ] Unit: list member role permission checks
- [ ] E2E: Two-user scenario — share list, both add items, verify sync via Supabase Realtime

### Design Decision: Product Sharing in Shared Lists (4.x)

**Issue Identified:** When User A shares a list with User B, items added with private products (created by A with `is_shared=false`) appear with a "—" placeholder to B because RLS denies access to private products.

**Decision Point:** Choose one of these approaches:

1. **Auto-share products on list share (recommended for MVP)**
   - When a list is shared with members, all product items currently in the list are temporarily treated as visible to members (via shared list context, not global)
   - Implementation: Modify products RLS to include `id IN (select product_id from shopping_items where list_id IN (select id from shopping_lists where list_id = ... and user in list_members))`
   - Pro: Simple, no UI changes needed
   - Con: Complex RLS logic; doesn't apply to products added *after* sharing

2. **Per-product share on item add**
   - When adding items to a shared list, prompt: "Share this product with list members?" Y/N
   - Implementation: New UI flow in `AddItemSheet`, new `products_list_access` junction table
   - Pro: Granular user control
   - Con: Additional complexity, friction in UX

3. **Global user share-all setting**
   - Add profile toggle: "Share all my new products with everyone"
   - Implementation: Add `auto_share_products` to profiles, check in product insert trigger
   - Pro: One-time decision, solves sharing going forward
   - Con: Doesn't help existing private products

4. **Role-based visibility (advanced)**
   - If `item.added_by` is a list member, their products become visible to other members *in that list's context*
   - Implementation: RLS policy checks if product creator is a member of the list containing the item
   - Pro: Context-specific, elegant
   - Con: Very complex RLS; may have performance implications

**Current state:** Items with inaccessible products show "—" gracefully (no crash). Functional but poor UX.

**DECISION:** ✅ **Approach (3) — Global user auto-share-all setting**
- Add `auto_share_products` boolean to profiles table
- Toggle in ProfilePage: "Share all new products I create"
- When enabled, new products auto-set `is_shared=true`
- Solves sharing for products added after setting is enabled
- Stage 4.x: Plan and implement this feature

---

## STAGE 5 — Recipes
> **Goal:** Full recipe management with ingredients (including substitutes and scaling), preparation steps, tool icons, and shopping list integration.
> **Estimated time:** 5–7 days

### Tasks

#### 5.1 — DB Migration: Recipes
- [ ] Create `recipes`, `recipe_ingredients`, and `recipe_steps` tables
- [ ] `substitute_group_id` is an integer grouping ingredients that can replace each other
- [ ] RLS: owner has full access; shared recipes are visible to all authenticated users

#### 5.2 — Recipes List Page (`/recipes`)
- [ ] Grid of recipe cards: title, servings, prep time, tool icon chips
- [ ] Search by title
- [ ] Filter by required tool (oven, stovetop, pot, pan, baking tray)
- [ ] "New Recipe" FAB

#### 5.3 — Recipe Detail Page (`/recipes/:id`)
- [ ] Header: title, description, servings spinner (adjusts all quantities reactively), prep time, tool icons
- [ ] **Tool icons row** — shown as active or inactive: oven | stovetop | pot | pan | baking tray | blender
- [ ] **Ingredients section:**
  - Items organized by substitute groups
  - Each row: product name, scaled quantity, unit, note
  - Substitute marker: small `<1>` badge next to the ingredient; substitute shown indented below it
  - "Add all to shopping list" button
  - Per-ingredient "+" icon to add a single ingredient to a list
- [ ] **Steps section:** numbered list of preparation steps
- [ ] Edit / Delete buttons (visible to owner only)

#### 5.4 — Recipe Create / Edit Form
- [ ] Fields: title, description, servings, prep time
- [ ] Tool checkboxes with icons: Oven, Stovetop, Pot, Pan, Baking Tray, Blender
- [ ] Ingredient builder:
  - Search and select product
  - Quantity + unit picker
  - Note text field (e.g., "crushed", "finely chopped and sautéed")
  - Assign to a substitute group (integer group number)
  - Add substitute: search product + note
  - Reorder via drag or up/down arrows
- [ ] Steps builder: add / remove / reorder free-text steps
- [ ] Preview mode toggle before saving

#### 5.5 — Add Ingredients to Shopping List
- [ ] "Add to list" per ingredient OR "Add all ingredients" bulk button
- [ ] Modal flow:
  - Select an existing active list OR create a new one
  - Shows items already in the selected list for reference
  - Per ingredient: if already in list → prompt "Already in list as X. Add Y more?" with Yes / No toggle
  - Adds item note: "For recipe: [recipe title]"
- [ ] Toast confirmation with a link to the target list

#### 5.6 — Servings Scaling
- [ ] Servings spinner in recipe header
- [ ] All ingredient quantities update reactively in the UI
- [ ] "Add to list" uses the scaled quantities

#### Stage 5 Manual Testing Checklist
- [ ] Create a recipe with 3 ingredients, 2 steps, and oven selected as a tool
- [ ] Oven icon appears on the recipe card and in the recipe header
- [ ] Adjust servings from 4 to 8 → all quantities double correctly
- [ ] Add a single ingredient to an existing list → item appears with recipe note
- [ ] Add all ingredients → all appear correctly with recipe notes
- [ ] Ingredient already in list → merge/quantity prompt appears
- [ ] Substitute group: ingredient shows `<1>` badge and substitute appears below it
- [ ] Edit recipe → changes persist after saving
- [ ] Delete recipe → confirmation dialog → recipe is removed from list

#### Automated Tests
- [ ] Unit: quantity scaling function (e.g., 4 servings → 8)
- [ ] Unit: substitute group rendering logic
- [ ] Unit: merge logic when ingredient already exists in target list
- [ ] E2E: Create recipe → add all ingredients to a new shopping list → verify all items appear

---

## STAGE 6 — Events
> **Goal:** Plan family/social events with guests, transport logistics, recipes, physical resources, and countdowns.
> **Estimated time:** 5–6 days

### Tasks

#### 6.1 — DB Migration: Events
- [ ] Create all events-related tables
- [ ] RLS: event owner and members can read/write; guests table is owner-managed

#### 6.2 — Events List Page (`/events`)
- [ ] Event cards: title, date, location, guest count, countdown ("12 days to go")
- [ ] Past events section — collapsible, sorted most recent first
- [ ] "New Event" FAB

#### 6.3 — Event Detail Page (`/events/:id`)

**Overview panel**
- [ ] Title, date, location
- [ ] Large countdown: "5 days to go" / "Today!" / "3 days ago"
- [ ] Tabbed or sectioned navigation: Guests | Checklist | Recipes | Shopping

**Guests section**
- [ ] Add guest: name + optional phone number
- [ ] "Needs transport?" toggle per guest
- [ ] If yes: "Who is driving?" dropdown (select another guest or event member)
- [ ] "What are they bringing?" free text per guest
- [ ] Confirmed toggle per guest
- [ ] Summary: "X guests, Y need transport"

**Checklist section**
- [ ] Add item: type (Chairs / Tables / Other), label, quantity, assigned to (guest or member)
- [ ] Checkmark to mark as arranged
- [ ] Quick counters: "Chairs: 8 / 12 arranged"

**Recipes section**
- [ ] Search and add recipes to the event
- [ ] Servings override per recipe (defaults to guest count)
- [ ] Summary of total shopping needs across all attached recipes
- [ ] "Generate Shopping List" button — creates one combined list from all recipe ingredients

**Shopping section**
- [ ] Link existing shopping lists to the event
- [ ] Create a new shopping list directly from the event
- [ ] Show status of each linked list (active / done)

#### 6.4 — Event Create / Edit Form
- [ ] Fields: title, date picker, location, notes
- [ ] Initial guest count (used as the default servings for recipes)

#### 6.5 — Combined Shopping List Generator
- [ ] "Generate Shopping List for Event" button
- [ ] Collects all recipe ingredients with quantities scaled to servings overrides
- [ ] Adds any manually entered event items (type = "other" with shopping intent)
- [ ] Merges duplicate products (sums same-unit quantities)
- [ ] Creates a named list: "Shopping — [Event Title]"
- [ ] Links the new list back to the event

#### 6.6 — Host Equipment Inventory (Profile)
> Track the host's permanent equipment inventory once in the Profile, then automatically deduct it from event equipment needs.

**Profile — Host Equipment card**
- Fixed 6 item types: Chairs, Dining Tables, Plates, Bowls, Cold Drink Glasses, Hot Drink Cups
- Stored in existing `host_inventory` table (migration 019): `owner_id`, `item_type`, `label`, `quantity_owned`; UNIQUE(owner_id, item_type)
- Read-only display mode: 2-column grid showing each item and its current quantity
- Edit mode (toggle via "Edit" button): steppers (+/−) per item, Save/Cancel, batch upsert all 6 rows on Save
- No migration needed — table and RLS policies were created in migration 019

**Equipment Tab — Inventory deduction**
- Extended item type picker with the 4 new types: Plates, Bowls, Cold Drink Glasses, Hot Drink Cups (in addition to existing Chairs, Tables, Other)
- Loads host inventory via `useQuery(['host-inventory'])` (RLS ensures only own rows returned)
- **Host Inventory summary panel** (blue, top of tab) — visible when any event equipment items exist:
  - Per item type: `{type}: need {needed} | have {owned}` + ` | still need {stillNeed}` when gap > 0
  - Green badge when fully covered by inventory; amber badge when gap remains
- **Inline "You have X" badge** on each item row when the host owns > 0 of that type
- Deduction formula: `stillNeed = Math.max(0, quantity_needed - quantity_owned)`

#### 6.7 — Contacts Enhancements

> **Goal:** Make contacts richer and smarter — label them by relationship, optionally link them to an existing app account, and let the sharing flow use names instead of bare emails.

##### 6.7.1 — Contact Labels (Family / Friend)

**DB change — migration 024**
```sql
ALTER TABLE contacts
  ADD COLUMN label text CHECK (label IN ('family', 'friend'));
```
- Nullable — no label means "unclassified"

**UI changes**
- `ContactForm`: add a three-way pill toggle below the Name field — **None / Family / Friend**
- `ContactRow`: show a colored badge next to the name
  - `Family` → warm amber/orange
  - `Friend` → teal/green
- `ContactsPage`: add a filter bar at the top — **All / Family / Friend** — filters the visible list client-side

**Type changes**
- `Contact` type: add `label: 'family' | 'friend' | null`
- `database.ts`: update `contacts` Row / Insert / Update to include `label`

---

##### 6.7.2 — Link Contact to System Account

> When the user provides an email address for a contact, the app checks if an account with that email exists and stores the link. This enables one-tap sharing later.

**DB change — migration 024 (same migration as label)**
```sql
ALTER TABLE contacts
  ADD COLUMN email text;
```
- Stored locally on the contact even if no account is found (for future use or display)
- `linked_user_id` column already exists on the `contacts` table (added in migration 019)

**UI changes — ContactForm**
- Add an optional **Email** field below the Phone field
- On save (not on blur, to avoid noisy requests):
  1. If email is non-empty, call `find_user_by_email(email)` (RPC from migration 005)
  2. If a user is found → set `linked_user_id` to that user's ID
  3. If not found → set `linked_user_id` to `null`, still save the email
- Show inline feedback: "Account linked ✓" or "No account with this email yet"

**ContactRow display**
- If `linked_user_id` is set: show a small "Linked" chip (purple, with a chain-link icon)
- If `email` is set but no `linked_user_id`: show the email in small grey text below the name (similar to phone)

**Type changes**
- `Contact` type: add `email: string | null`
- `database.ts`: update `contacts` Row / Insert / Update to include `email`

---

##### 6.7.3 — Share by Contact Name (wired up in 4.7)

The `ContactPicker` component required for list/event sharing is specified in **Stage 4.7**. This sub-section only notes what the contacts data model must expose for it to work:

- `contacts.linked_user_id` — used to share directly without an email lookup
- `contacts.email` — fallback when no account is linked
- `contacts.label` — used for filter chips in the picker (`All / Family / Friend`)
- `contacts.name` — primary display text in the picker

---

#### Stage 6 Manual Testing Checklist
- [ ] Create an event set for next week → countdown shows correct number of days
- [ ] Add 5 guests, mark 2 as needing transport, assign a driver to each
- [ ] Add a checklist item (e.g., "12 chairs") and mark as arranged
- [ ] Attach a recipe to the event → servings default to guest count
- [ ] Generate shopping list from recipes → all ingredients appear with correct quantities
- [ ] Link an existing shopping list to the event → it shows in the Shopping section
- [ ] Past events appear in the past section
- [ ] Countdown updates correctly relative to today
- [ ] Add a contact with label "Family" → amber badge appears on the contact row
- [ ] Add a contact with label "Friend" → teal badge appears
- [ ] Filter contacts by "Family" → only family contacts shown; "All" restores full list
- [ ] Add a contact with a valid registered email → "Account linked ✓" appears and linked chip shows on the row
- [ ] Add a contact with an unknown email → "No account with this email yet" feedback; email still saved
- [ ] Open share dialog for a list → contact chips appear; tapping a linked contact shares without typing an email
- [ ] Tapping an unlinked contact with an email auto-fills the email field

#### Automated Tests
- [ ] Unit: countdown calculation (days until a given date)
- [ ] Unit: shopping list merge/deduplication logic for the combined list generator
- [ ] Unit: transport assignment options only include available people
- [ ] Unit: ContactPicker — filters by label correctly, linked contacts skip email lookup
- [ ] E2E: Create event → add guests → attach recipe → generate shopping list → verify

---

## STAGE 7 — PWA, Polish & Performance
> **Goal:** The app feels native on mobile, loads fast, and supports offline viewing.
> **Estimated time:** 3–4 days

### Tasks

#### 7.1 — PWA Setup
- [ ] Install `vite-plugin-pwa` and configure the web app manifest
- [ ] Manifest fields: name, short_name, icons, theme_color, `display: standalone`
- [ ] Service worker: cache static assets + most recently fetched lists
- [ ] Offline banner: "No connection — showing saved data"
- [ ] "Install App" prompt for mobile users (beforeinstallprompt)

#### 7.2 — Performance
- [ ] Lazy-load all route components with `React.lazy` + `Suspense`
- [ ] Virtualize long lists using `@tanstack/virtual`
- [ ] Lighthouse audit: target Performance > 90, Accessibility > 95

#### 7.3 — Accessibility
- [ ] All interactive elements have proper aria-labels (in both Hebrew and English)
- [ ] Color contrast meets WCAG AA minimum
- [ ] Fully keyboard-navigable on desktop
- [ ] Screen reader tested (VoiceOver on iOS / NVDA on Windows)

#### 7.4 — UX Polish
- [x] Skeleton loaders for all data-fetching states (PR #93)
- [x] App version shown in profile dropdown menu (PR #96)
- [ ] Empty states with friendly inline SVG illustrations
- [ ] Error boundaries per page section
- [ ] Pull-to-refresh on mobile (lists overview page)
- [ ] Swipe left on a list item to reveal delete (mobile)
- [ ] Subtle press animations on interactive elements

#### 7.6 — App Background Theme — MOVED to Stage 11.3
The background theme picker has been folded into **Stage 11 — Theming & Appearance** as sub-stage 11.3. See Stage 11 for the full design (presets + dark mode + backgrounds + text scale).

#### 7.5 — Push Notifications (Post-MVP optional)
- [ ] Browser push notifications for shared list updates
- [ ] Event reminder: "Your event is in 3 days!"

#### Stage 7 Manual Testing Checklist
- [ ] On iPhone Safari: "Add to Home Screen" prompt appears and app installs correctly
- [ ] With airplane mode enabled: last-viewed lists are still readable
- [ ] Lighthouse score: Performance >= 90 on mobile simulation
- [ ] No console errors on any main page
- [ ] Layout is correct at 375px (iPhone SE), 768px (iPad), 1440px (desktop)
- [ ] RTL layout is correct across all views in Hebrew mode
- [ ] LTR layout is correct across all views in English mode
- [ ] Background theme picker shows all 3 options with a live preview swatch
- [ ] Selecting Aero Gradient applies a soft blue gradient across all pages on both mobile and desktop
- [ ] Selecting Abstract Blobs applies the pastel blob background across all pages on both mobile and desktop
- [ ] Switching back to White restores the plain white background
- [ ] Selected theme persists after page refresh (localStorage)
- [ ] Selected theme syncs to the profile and loads correctly after logout → login on a different device

---

## STAGE 8 — Final QA & Launch
> **Goal:** Production-ready release for the family/friends group.
> **Estimated time:** 2–3 days

### Tasks

#### 8.1 — Security Audit
- [ ] Manually verify RLS policies for every table across all user roles
- [ ] Confirm no sensitive data is exposed in client-side code or committed `.env` files
- [ ] Verify Supabase Auth rate limiting is enabled on the project

#### 8.2 — Data Seeding
- [ ] Seed file: 50+ common products with Hebrew + English names and categories
- [ ] Seed file: standard unit types confirmed complete and correct
- [ ] Optional: 5–10 sample recipes for demo purposes

#### 8.3 — User Acceptance Testing (UAT)
- [ ] Invite 2–3 family/friends to use the app as real users
- [ ] Document all reported bugs and fix them
- [ ] Test on real iOS and Android devices
- [ ] Test on Chrome, Safari, and Firefox

#### 8.4 — Production Deploy
- [ ] Confirm all environment variables are set in Vercel production environment
- [ ] Run full Playwright E2E suite against the production URL
- [ ] Enable Supabase automatic daily database backups
- [ ] Integrate Sentry for error monitoring (free tier)
- [ ] Create a simple onboarding checklist for new users joining the group

---

## STAGE 9 — Events Enhancements
> **Goal:** Make events richer and more collaborative: surface photo albums, share with collaborators, support discussion, and capture post-event retros.
> **Estimated time:** 4–5 days
> Each sub-stage below is shipped as its own PR.

### 9.1 — Photo Album Link on Event Cards (PR #79) — COMPLETE
- [x] On `/events`, each `EventCard` shows a compact "Album" chip when `photo_album_url` is set
- [x] Chip is a clickable link (opens in a new tab, `rel="noopener noreferrer"`)
- [x] `stopPropagation` / `preventDefault` so clicking the chip doesn't trigger card navigation
- [x] Only rendered for valid `http(s)` URLs (reuse the same validation used in `EventDetailPage`)
- [x] Reuses existing i18n keys (`events:detail.photoAlbum`, `events:detail.openAlbum`)
- [x] Icon: `ImageIcon` or `ExternalLink` from `lucide-react` for consistency with the detail page

### 9.2 — Event Sharing (mirror Lists) (PR #81) — COMPLETE
- [x] New `ShareEventDialog` modeled on `ShareListDialog`
- [x] Reuses the existing `event_members` table (migration 019) — roles: `owner | editor | viewer`
- [x] Verify / extend RLS so event members can read the event and its children (invitees, equipment, recipes, shopping lists) — **migration 032**
- [x] Add share button to `EventDetailPage` header
- [x] `useEventRole` hook paralleling `useListRole`
- [x] `AvatarStack` on event cards and event detail header (same component used for lists)
- [x] Integrate `ContactPicker` (Stage 4.7) for share-by-contact
- [x] Events page query returns events where user is owner **or** member

### 9.3 — Email Notifications for Shares (deferred — post-MVP)
> Parked by owner on 2026-04-22. Will revisit. Covers lists, events, and future recipes.
> When picked up: Supabase Edge Function + transactional provider (Resend / Postmark / SendGrid).

### 9.4 — Event Comments & Post-Mortem (PR #80) — COMPLETE
- [x] New migration: `event_comments` table (migrations **030** + **031** for updated_at trigger)
  - Fields: `id`, `event_id FK`, `user_id FK`, `body TEXT`, `created_at`, `updated_at`
  - RLS: event owner + members can read/insert; author can update/delete their own comment
- [x] `EventDetailPage` header: two new buttons at the top — **Comments** and **Post-mortem**
- [x] **Comments** button always enabled — opens a comments panel/drawer
  - List of comments (author avatar + display name + timestamp + body)
  - Textarea + Send button at the bottom
  - Realtime subscription on `event_comments` for the open event
- [x] **Post-mortem** button enabled only when `new Date(event.date) < now` — otherwise greyed out with tooltip
  - Opens an editor for existing `retro_*` fields (migration 019): `retro_enough_food`, `retro_what_went_wrong`, `retro_what_went_well`, `retro_remember_next_time`
  - Editable by owner + editors
- [x] i18n keys in both `en` and `he` for all new labels

#### Stage 9 Manual Testing Checklist
- [ ] Event with `photo_album_url` shows an Album chip on the card; clicking opens the album in a new tab without navigating to the event detail
- [ ] Event without `photo_album_url` shows no chip
- [ ] Share dialog on event invites another user → event appears in their `/events` page
- [ ] Member can view / edit event according to their role; viewer cannot edit
- [ ] Comments panel opens; sending a comment appears immediately and is visible to other members in realtime
- [ ] Post-mortem button is disabled for future events, enabled for past events
- [ ] Post-mortem editor saves retro fields; values persist on refresh

#### Automated Tests
- [ ] Unit: URL validation for the photo album chip (only `http(s)` renders)
- [ ] Unit: `useEventRole` returns correct role for owner / editor / viewer / non-member
- [ ] Unit: post-mortem button enabled/disabled based on `event.date` vs. now
- [ ] Unit: RLS — non-member cannot read `event_comments` for an event

---

## STAGE 10 — Performance Optimization ✅ COMPLETE
> **Goal:** Mobile responsiveness polish — reduce re-renders, debounce input, eliminate N+1 queries, add DB indexes, lazy-load routes, and tighten realtime filters.
> **Status:** All 6 PRs merged to `main`.
> **Context:** The app feels sluggish on mobile. Root causes: (1) heavy derived-state recomputation with no memoization, (2) search inputs re-rendering on every keystroke, (3) N+1 query on the Lists page, (4) Supabase free-tier cold starts (unrelated, infra-bound). Work was split across 6 small, independently revertable PRs.

### 10.1 — React quick wins (PR #76) — COMPLETE
**Branch:** `perf/react-quick-wins` | **Risk:** Low (pure frontend)
- [x] `useMemo` for `uncheckedItems`, `checkedItems`, and `groupByCategory` result in `ListDetailPage` — prevents `groupByCategory` rebuilding a Map on every `togglingIds` state change
- [x] New `src/hooks/useDebounce.ts` (200ms default)
- [x] Debounced search in `ProductsPage`, `RecipesPage`, and `AddItemSheet` (ListDetailPage)
- [x] `useMemo` for `grouped` / `uncategorized` in `ProductsPage` (replaces O(n × categories) inline filter/some)
- [x] `React.memo` on `AvatarStack` + memoized sort

### 10.2 — Optimistic toggle for shopping items (PR #77) — COMPLETE
**Branch:** `perf/optimistic-toggle` | **Risk:** Low (bounded to one mutation)
- [x] `toggleMutation` in `ListDetailPage` adds `onMutate`: `cancelQueries`, snapshot, optimistic `is_checked` patch, add to `togglingIds`
- [x] Rollback in `onError` restores the snapshot and shows error toast
- [x] Removed `invalidateQueries` from `onSettled` — realtime + broadcast reconcile on the happy path
- [x] Undo toast path in `onSuccess` unchanged

### 10.3 — N+1 fix for ListsPage (PR #78) — COMPLETE
**Branch:** `perf/lists-n-plus-1` | **Risk:** Medium (new RPC)
- [x] Migration **029** — `get_all_list_members_for_user()` RPC returns all members across all caller's owned + shared lists in one query, joined with profile data
- [x] `ListsPage` uses a single `useQuery(['all_list_members', user.id])`; builds `Map<listId, members[]>` with `useMemo`; passes `members` as prop to each `ListCard`
- [x] Removed the per-card `useQuery(['list_members', list.id])` → 10 lists now = 1 query instead of 11

### 10.4 — DB indexes (PR #90) — COMPLETE
**Branch:** `perf/db-indexes` | **Risk:** Very low (SQL-only)
- [x] Migration **033** — `shopping_items_list_checked_idx` (list_id, is_checked, sort_order, created_at)
- [x] Migration **033** — `shopping_items_product_idx` (product_id)
- [x] Migration **033** — partial `shopping_lists_active_idx` (owner_id, is_archived, created_at) WHERE deleted_at IS NULL

### 10.5 — Route lazy loading (PR #91) — COMPLETE
**Branch:** `perf/route-lazy-loading` | **Risk:** Medium (affects initial load + Suspense behavior)
- [x] All page imports in `src/App.tsx` converted to `React.lazy(() => import(...))` — `ListsPage`, `ListDetailPage`, `ProductsPage`, `RecipesPage`, `RecipeDetailPage`, `RecipeFormPage`, `EventsPage`, `EventDetailPage`, `ContactsPage`, `ProfilePage`, `TrashPage`
- [x] `<Routes>` wrapped in `<Suspense>` with skeleton fallback
- [x] `AuthPage` kept eager (first paint)

### 10.6 — Realtime server-side filter (PR #92) — COMPLETE
**Branch:** `perf/realtime-filter` | **Risk:** Low (but touches realtime, keep isolated)
- [x] In `ListDetailPage`, `filter: \`list_id=eq.${id}\`` added to the `postgres_changes` subscription for `shopping_items` — eliminates client-side filtering of all-table events

### Deferred (not in this batch)
- **Memoize `ItemRow` callbacks** — high impact at 50+ items but requires a non-trivial refactor; revisit after profiling PR #76
- **Virtual scrolling** (`@tanstack/react-virtual`) — only if a user has 200+ products or 100+ list items; measure first
- **Prefetch on hover/touch** in `ListCard` — UX polish; revisit after core perf PRs
- **Supabase Pro tier upgrade** — eliminates cold starts; code fixes only improve warm performance

### Per-PR verification (quality gates)
1. `npm test` — all Vitest tests green
2. `npm run lint` — zero errors
3. `npm run format` — no diffs
4. `supabase migration list` — for PRs that add migrations, confirm applied
5. Manual smoke test on the affected page

---

## STAGE 11 — Theming & Appearance
> **Goal:** Let users customize the app's look via cohesive preset themes plus orthogonal toggles for dark mode and text size. Folds in Stage 7.6's background picker.
> **Estimated time:** 3–4 days
> **Note:** Replaces Stage 7.6 (Background Theme). 7.6 has been absorbed as 11.3 below.

### Model

- **Presets** bundle accent color, corner radius, density, and avatar style into one cohesive look. Users pick one preset instead of juggling individual knobs.
- **Orthogonal axes** — dark mode and text scale — apply on top of any preset.
- All values are driven by CSS custom properties on `<html>` so a single attribute flip changes the whole app without remounts.

### Preset catalog (v1)

| Preset id | Vibe | Accent | Radius | Density | Avatar |
|---|---|---|---|---|---|
| `classic` | Current Bring!-inspired warm | orange 500 `#f97316` | rounded-lg | comfortable | beam |
| `minimal` | Neutral, sharp, professional | slate 700 | rounded-sm | compact | marble |
| `warm` | Earthy, soft, hospitable | terracotta `#c2410c` + sage accent | rounded-2xl (pill) | spacious | sunset |

### 11.1 — DB migration
- [ ] New migration: add columns to `profiles`
  ```sql
  ALTER TABLE profiles
    ADD COLUMN ui_preset    text    DEFAULT 'classic' CHECK (ui_preset IN ('classic', 'minimal', 'warm')),
    ADD COLUMN theme_mode   text    DEFAULT 'system'  CHECK (theme_mode IN ('light', 'dark', 'system')),
    ADD COLUMN text_scale   text    DEFAULT 'md'      CHECK (text_scale IN ('sm', 'md', 'lg')),
    ADD COLUMN app_background text  DEFAULT 'white'   CHECK (app_background IN ('white', 'aero', 'blobs'));
  ```
- [ ] RLS: user can read/update only their own row (existing policies cover this).
- [ ] No data backfill needed — defaults preserve today's look.

### 11.2 — Theme token system
- [ ] Refactor `src/index.css`: move all `:root` CSS vars into three `[data-preset="..."]` blocks (classic / minimal / warm). Each block defines the full semantic palette plus `--radius`, `--density-row`, `--density-gap`, `--font-size-base`.
- [ ] Keep the existing `.dark` class orthogonal — dark overrides apply inside every preset.
- [ ] Update `tailwind.config.ts` to reference `var(--radius)` and density vars for consistent spacing utilities.
- [ ] New file `src/lib/theme.ts` exports:
  - `type UiPreset = 'classic' | 'minimal' | 'warm'`
  - `type ThemeMode = 'light' | 'dark' | 'system'`
  - `type TextScale = 'sm' | 'md' | 'lg'`
  - `type AppBackground = 'white' | 'aero' | 'blobs'`
  - `applyTheme(settings)` — sets `data-preset`, `data-background`, `data-text-scale` on `<html>` and toggles `.dark` based on mode + `prefers-color-scheme`.

### 11.3 — Background styles (absorbs old Stage 7.6)
- [ ] Add three layered `body::before` / `body::after` background styles keyed off `html[data-background]`:
  - `white` — plain (current default)
  - `aero` — soft blue/sky radial gradient tuned for portrait + landscape via `@media (orientation)`
  - `blobs` — pastel bokeh shapes via layered `radial-gradient`s with `blur` — no image assets
- [ ] Backgrounds must remain fixed behind scroll (`background-attachment: fixed`) and respect safe-area insets already defined in index.css.

### 11.4 — Zustand + persistence layer
- [ ] Extend `src/store/useAppStore.ts` with `uiPreset`, `themeMode`, `textScale`, `appBackground` plus setters. Persist to localStorage (existing Zustand persist already handles `isDarkMode` — extend the same slice and migrate `isDarkMode` → `themeMode: 'dark' | 'light'`).
- [ ] On auth state change (existing `useAuth` / `AuthProvider`): after profile load, hydrate the store from `profiles` columns, then call `applyTheme()`. On setting change while authenticated, debounced-upsert to `profiles` (same pattern as `preferred_language` in `ProfilePage.tsx`).
- [ ] Update the FOUC-prevention `<head>` script in `index.html` to also read `ui_preset`, `theme_mode`, `text_scale`, `app_background` from localStorage and set the attributes before first paint — prevents theme flash on page load.

### 11.5 — Profile "Appearance" section
- [ ] New block in `ProfilePage.tsx` below the language toggle:
  - **Preset picker** — 3 preview cards (mini mock showing button + card + text in that preset's tokens). Tapping selects.
  - **Dark mode** — segmented control: Light / Dark / System (follows `prefers-color-scheme`).
  - **Background** — 3 preview swatches: White / Aero / Blobs.
  - **Text size** — segmented control: S / M / L.
- [ ] Changes apply live — no save button; writes through Zustand setter → `applyTheme()` → debounced `profiles` update.
- [ ] Component: `src/components/Appearance/AppearancePanel.tsx` to keep ProfilePage lean.
- [ ] Reuse `Button`, `Card`, `Label` from existing shadcn/ui.

### 11.6 — Avatar style follows preset
- [ ] `UserAvatar.tsx`: replace hardcoded `variant="beam"` with a `PRESET_TO_AVATAR_VARIANT` map keyed off `uiPreset`. Read via a small `useUiPreset()` selector to avoid subscribing to the full store.

### 11.7 — i18n
- [ ] Add keys under `common.appearance.*` in `src/locales/{he,en}/common.json`:
  - `title`, `preset.classic`, `preset.minimal`, `preset.warm`
  - `mode.light`, `mode.dark`, `mode.system`
  - `background.white`, `background.aero`, `background.blobs`
  - `textSize.sm`, `textSize.md`, `textSize.lg`

### Stage 11 Manual Testing Checklist
- [ ] Picking each of the 3 presets visibly changes accent color, corner radius, density, and avatar style across all pages
- [ ] Dark mode toggles independently and correctly overlays each preset
- [ ] System mode follows OS `prefers-color-scheme` and updates when OS theme changes
- [ ] Background picker applies on all pages (lists, recipes, events, profile) in both portrait and landscape
- [ ] Text size scales all text proportionally; layout remains usable at `lg`
- [ ] RTL (Hebrew) layout renders correctly in every preset × background × mode combination
- [ ] Settings persist after page refresh (localStorage)
- [ ] Logout → login on a different device restores the theme from `profiles`
- [ ] No theme flash on initial page load (FOUC script sets attributes before first paint)
- [ ] Logged-out user can still pick themes; settings persist via localStorage and migrate to profile on sign-up

### Automated Tests
- [ ] Unit: `applyTheme()` sets the right `data-*` attributes and `.dark` class for every combination of `{preset, mode, textScale, background} × {light, dark, system}` × `prefers-color-scheme`
- [ ] Unit: Zustand persist migration for legacy `isDarkMode` → `themeMode`
- [ ] Unit: `PRESET_TO_AVATAR_VARIANT` returns a valid boring-avatars variant for every preset
- [ ] E2E: Profile → change preset → navigate to /lists → verify `html[data-preset]` value and a known accent-color element

---

## STAGE 11.8 — Advanced Appearance Mode

> **Goal:** Extend the Basic appearance panel with an opt-in Advanced mode that lets users freely pick an accent color and choose from a richer set of backgrounds, replacing the 3-preset constraint.
> **Estimated time:** 1–2 days
> **Prerequisite:** Stage 11 (PRs #97, #99, #100) fully merged to `main`.

### Model

- **Basic mode** (current) — 3 preset cards + 3 background swatches. Simple, opinionated.
- **Advanced mode** — toggled by a "Advanced" pill/switch in the Appearance card. Reveals:
  - A **hue slider + saturation grid** (or a curated 24-color palette grid) for picking a custom accent color
  - A richer **background picker** — 10–12 options including plain, gradients, and multi-stop blobs

When advanced mode is active the preset picker is hidden (a custom accent overrides it). Switching back to Basic resets to the last-used preset.

### 11.8.1 — DB migration 035
- [ ] Add two columns to `profiles`:
  ```sql
  ALTER TABLE profiles
    ADD COLUMN appearance_mode text DEFAULT 'basic' CHECK (appearance_mode IN ('basic', 'advanced')),
    ADD COLUMN custom_accent_color text DEFAULT NULL;  -- hex e.g. '#6366f1'
  ```
- [ ] Extend `app_background` CHECK constraint to include the new background values (or store as free text and validate in app):
  `'white' | 'aero' | 'blobs' | 'gradient-sunset' | 'gradient-forest' | 'gradient-ocean' | 'gradient-candy' | 'gradient-dusk' | 'noise-warm' | 'noise-cool'`
- [ ] No backfill needed — defaults keep current behaviour.

### 11.8.2 — Custom accent ramp generation (`src/lib/theme.ts`)
- [ ] Add `applyCustomAccent(hex: string)` — derives a 10-stop `--brand-*` ramp from the picked hue using HSL lightness steps, injects them as inline styles on `<html>`. No preset CSS block needed.
- [ ] Add `clearCustomAccent()` — removes the inline style overrides so the active preset's CSS vars take over again.
- [ ] Extend `AppBackground` union type with the new background values.
- [ ] Extend `applyTheme()` to call `applyCustomAccent` / `clearCustomAccent` based on `appearanceMode`.

### 11.8.3 — New background styles (`src/index.css`)
Add `body::before` rules for each new background value:
- [ ] `gradient-sunset` — coral → amber → yellow horizontal gradient
- [ ] `gradient-forest` — deep green → sage → mint
- [ ] `gradient-ocean` — deep blue → teal → cyan
- [ ] `gradient-candy` — pink → lavender → sky
- [ ] `gradient-dusk` — indigo → purple → rose
- [ ] `noise-warm` — warm off-white with subtle SVG noise texture (inline data URI, no image assets)
- [ ] `noise-cool` — cool gray with subtle SVG noise texture

### 11.8.4 — Zustand + persistence
- [ ] Add `appearanceMode: 'basic' | 'advanced'` and `customAccentColor: string | null` to `useAppStore`.
- [ ] Add `setAppearanceMode` and `setCustomAccentColor` setters; each calls `applyTheme()` after updating state.
- [ ] Persist both to localStorage; hydrate from `profiles` on login (same pattern as existing theme fields).
- [ ] Update FOUC script in `index.html` to read `appearanceMode` and `customAccentColor` from localStorage and call `applyCustomAccent` before first paint if advanced mode is active.

### 11.8.5 — Advanced Appearance UI (`AppearancePanel.tsx`)
- [ ] Add a **Basic / Advanced** segmented toggle at the top of the Appearance card.
- [ ] **Basic mode** — existing preset + mode + background + text-size controls (no change).
- [ ] **Advanced mode** — replaces preset picker with:
  - **Color palette grid** — 24 curated swatches (6 columns × 4 rows) covering a full hue wheel. Tapping a swatch sets `customAccentColor` and calls `applyCustomAccent`.
  - **Hue slider** (optional, below the grid) — fine-tune the hue; updates the same custom accent.
  - **Background picker** — expanded grid showing all 10 options with gradient preview swatches.
- [ ] Switching back to Basic clears `customAccentColor` and re-applies the last preset.
- [ ] Debounce-save to `profiles` on every change (same 800ms pattern).

### 11.8.6 — i18n
- [ ] Add keys to `en/common.json` and `he/common.json` under `appearance.*`:
  - `modeBasic`, `modeAdvanced`, `customColor`, `customColorHint`
  - New background names: `background.gradientSunset`, `background.gradientForest`, `background.gradientOcean`, `background.gradientCandy`, `background.gradientDusk`, `background.noiseWarm`, `background.noiseCool`

### Manual Testing Checklist — Stage 11.8
- [ ] Basic / Advanced toggle appears at top of Appearance card
- [ ] Switching to Advanced hides preset picker, shows color palette + extended background grid
- [ ] Tapping a color swatch changes all brand-colored elements instantly (buttons, active states, badges)
- [ ] Hue slider (if implemented) fine-tunes the accent live
- [ ] All 10 background options render correctly on Lists / Recipes / Events pages
- [ ] Switching back to Basic clears custom color and restores last preset
- [ ] Settings persist after page refresh and across devices
- [ ] No FOUC — custom accent applied before first paint when advanced mode is stored

---

## STAGE 12 — Android App & "Quick Add Missing Item" Widget
> **Goal:** Ship a debug-installable Android APK containing the existing web app running in a native WebView shell, plus a first home-screen widget that launches a minimal quick-add screen and writes into the user's Missing Items list.
> **Estimated time:** 4–6 days
> **Scope:** One widget + scaffolding to add more later. Play Store publishing is out of scope.

### Decisions (locked in with user)

- **Backend path:** Capacitor-wrapped web app + new Supabase Edge Function `add-missing-item` that atomically finds/creates the missing list, finds/creates the product, and inserts the shopping item.
- **Widget UX:** Tap opens a minimal in-app quick-add screen (search + recents + voice mic + "create new"), **not** an inline RemoteViews EditText. Works on Android 8+ without relying on RemoteViews text input.
- **Min SDK:** 26 (Android 8+). Raising later is a one-line change in `android/app/build.gradle` — unlocks inline-EditText widgets at API 31+ without breaking existing flow.
- **Product access:** The quick-add screen lets the user search their **full** product catalog (shared + own, enforced by existing RLS on `products`) and falls back to "create new [typed text]" when nothing matches.

### Architectural Shape

```
┌─────────────────────────┐           ┌──────────────────────┐
│ Android home screen     │           │ Existing web app     │
│  [Widget: + Missing]    │  tap ──▶  │ (Capacitor WebView)  │
└─────────────────────────┘           │                      │
                                      │  /quick-add route    │
                                      │   ├─ search input    │
                                      │   ├─ recents (5)     │
                                      │   ├─ matching prods  │
                                      │   └─ "create new X"  │
                                      └──────────┬───────────┘
                                                 │ supabase.functions.invoke
                                                 ▼
                                      ┌──────────────────────┐
                                      │ Edge Function        │
                                      │ add-missing-item     │
                                      │  1. find/create      │
                                      │     missing list     │
                                      │  2. upsert product   │
                                      │  3. insert item      │
                                      └──────────────────────┘
```

Why this shape:
- **One codebase.** The quick-add screen is a normal React route; the native widget is a ~60-line Kotlin shell.
- **No auth duplication.** The Capacitor WebView shares `localStorage` with the web app, so the supabase-js session is reused. The widget itself does **not** talk to Supabase directly.
- **Atomic writes.** The Edge Function centralizes the three-step rule (find-or-create missing list, find-or-create product, insert item) so the widget path stays simple and RLS-safe.

### 12.1 — Edge Function `add-missing-item` (new)
**Branch:** `feat/stage-12-add-missing-item-fn` | **Risk:** Low (pure additive, reuses existing tables)

- [ ] New file: `supabase/functions/add-missing-item/index.ts`. Accepts **either**:
  - `{ product_id: uuid }` — pick an existing product (validated under caller's JWT so RLS enforces visibility), **or**
  - `{ name_he: string, name_en?: string }` — find-or-create by name.
- [ ] Logic (all under the caller's JWT; no service-role escalation):
  1. Find-or-create the user's active missing list (`is_missing_list = true AND is_archived = false`). Mirrors `src/pages/Lists/ListsPage.tsx:181-200`.
  2. Resolve product: by id (verify visibility) or by case-insensitive `name_he` match; create if none found with `{ name_he, name_en, created_by, is_shared: false }`.
  3. Insert into `shopping_items { list_id, product_id, added_by, quantity: 1, unit_id: products.default_unit_id }`.
- [ ] Response: `{ list_id, item_id, product_id, created_new_product: boolean }`.
- [ ] Unit tests (Deno) covering: no missing list exists, missing list exists, product by id, product by name (existing), product by name (new).
- [ ] Smoke test via `supabase functions serve` against local DB.

### 12.2 — `/quick-add` route (new page)
**Branch:** `feat/stage-12-quick-add-page` | **Risk:** Low (new isolated route)

- [ ] New route in `src/App.tsx`: `/quick-add` mounting `<QuickAddPage />`, auth-guarded like other pages.
- [ ] New page `src/pages/QuickAdd/QuickAddPage.tsx`:
  - Auto-focused search input filtering the user's full product catalog (visible via existing RLS: `is_shared = true OR created_by = auth.uid()`).
  - Results list — each row tap fires `supabase.functions.invoke('add-missing-item', { body: { product_id } })`, then toast + close.
  - "Create new [typed text]" row appears when there's no exact match (mirrors behavior in `src/pages/Lists/ListDetailPage.tsx:758-834`). Tap → function call with `{ name_he }` → creates product + adds in one step.
  - **Recents row** above search — top 5 products from the user's recent `shopping_items` (by `added_by` + `created_at desc`) for one-tap repeat adds.
  - Voice mic button using existing `src/hooks/useVoiceInput.ts` — dictated text drives search-as-you-type.
  - On success: toast "Added to Missing Items"; if running under Capacitor → `App.exitApp()`; otherwise navigate to `/lists`.
- [ ] Tests: render, search filter, invoke calls with correct body shape, voice button focuses input.

### 12.3 — Capacitor scaffolding
**Branch:** `feat/stage-12-capacitor` | **Risk:** Medium (adds native toolchain, new deps)

- [ ] Install deps: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`.
- [ ] Root `capacitor.config.ts` — `appId: com.sbecker.shoppingrecipesevents`, `webDir: dist`.
- [ ] Generate `android/` via `npx cap add android`; commit the full directory.
- [ ] `.gitignore`: add `android/app/build/`, `android/.gradle/`, `android/local.properties`, `android/app/release/`.
- [ ] `package.json` scripts:
  - `"cap:sync": "npm run build && cap sync android"`
  - `"cap:open": "cap open android"`
  - `"android:debug": "npm run cap:sync && cd android && ./gradlew assembleDebug"`
- [ ] New `src/lib/deepLink.ts` (~20 lines): listens to Capacitor `App` plugin URL events; on URLs matching `/quick-add`, navigates via the React router. Registered from `src/main.tsx`.
- [ ] Verify `./gradlew assembleDebug` succeeds locally. No widget yet — app just runs as a native WebView.

### 12.4 — Missing Item widget (native Kotlin)
**Branch:** `feat/stage-12-android-widget` | **Risk:** Medium (native surface)

- [ ] `android/app/src/main/java/.../MissingItemWidget.kt` — `AppWidgetProvider` that builds a `RemoteViews` with a single tap target firing a `PendingIntent`.
- [ ] `android/app/src/main/java/.../QuickAddActivity.kt` — thin `Activity` that launches the Capacitor `BridgeActivity` with Intent data `app://quick-add`.
- [ ] `android/app/src/main/res/xml/missing_item_widget_info.xml` — metadata (min width/height, `widgetCategory="home_screen"`, `initialLayout`, preview image).
- [ ] `android/app/src/main/res/layout/widget_missing_item.xml` — 2×1 layout: icon + "Add missing item" label.
- [ ] `android/app/src/main/res/drawable/widget_preview.png` — flat preview image.
- [ ] `AndroidManifest.xml` — register `MissingItemWidget` receiver and `QuickAddActivity`.
- [ ] Deep-link flow verified end-to-end: widget tap → `QuickAddActivity` → `BridgeActivity` with URI → `deepLink.ts` → React router → `/quick-add`.

### 12.5 — Database
- [ ] **No schema changes.** All required tables (`shopping_lists`, `products`, `shopping_items`) already have the right columns and RLS:
  - `shopping_lists.is_missing_list` already present.
  - `products` INSERT policy: `created_by = auth.uid()`.
  - `shopping_items` INSERT policy: `list_member_role(list_id) in ('owner','editor')` via migration 026.
  - Server-side attribution (`added_by`, `updated_at`, `last_edited_by`) handled by the `shopping_items_stamp_edit` trigger.

### 12.6 — CI & Docs
- [ ] **No Android build in CI yet.** Local-only `./gradlew assembleDebug` for now. Revisit if/when we want signed builds or Play Store artifacts.
- [ ] `docs/PROGRESS.md` — add Stage 12 entry per PR.
- [ ] No changes to existing workflows in `.github/workflows/` for this stage.

### Stage 12 Manual Testing Checklist

**Mobile browser (no Android needed — after PR 12.1 + 12.2):**
- [ ] Sign in on phone, visit `https://<app>/quick-add`.
- [ ] Search part of an existing product name → tap row → item lands in Missing Items with correct product (no duplicate product row).
- [ ] Type a brand-new name → tap "Create new X" → product created and added in one step.
- [ ] Tap a product in the Recents row → one-tap add works.
- [ ] Voice-dictate a known product name → search narrows to it.
- [ ] Delete the auto-created Missing Items list in the main app → repeat quick-add → edge function recreates it.
- [ ] A **shared** product (`is_shared = true`, created by another household member) appears in results and is added without being cloned.

**Android device or emulator (after PR 12.3 + 12.4):**
- [ ] `npm run android:debug` succeeds.
- [ ] `adb install android/app/build/outputs/apk/debug/app-debug.apk` installs.
- [ ] First launch: sign in; confirm session persists after force-close and relaunch.
- [ ] Long-press home screen → Widgets → "Quick Add Missing" appears with preview image.
- [ ] Drop widget on home screen → tap → QuickAddPage opens within ~1s.
- [ ] Add an item → toast shown → confirm it's visible in the Missing Items list on the desktop web app (cross-device).
- [ ] Airplane mode → tap widget → graceful error (no crash). Offline queueing is explicitly out of scope.

### Automated Tests
- [ ] Unit (Deno): `add-missing-item` edge function — no missing list, missing list exists, product-by-id, product-by-name-existing, product-by-name-new.
- [ ] Unit (Vitest): `QuickAddPage` renders, search filters, submit calls `functions.invoke` with correct body, voice mic focuses input.
- [ ] Typecheck + lint + format clean across all new files.

### Non-goals (documented to prevent scope creep)
- Offline queueing from the widget (would require Room DB + a sync worker).
- Additional widgets (shopping list glance, recipe of the day, next event countdown) — future stages.
- iOS widget (WidgetKit) — future stage.
- Play Store publishing, signing, release pipeline.

### Raising Android Min SDK later

User asked whether upgrading to a later Android version is possible. Yes — edit `android/app/build.gradle`:

```gradle
defaultConfig {
  minSdk 26   // ← raise to 31 or 34 later
  targetSdk 34
}
```

Raising to API 31+ unlocks `RemoteViews` with inline `EditText`, rounded corners, and dynamic colors — useful for a v2 widget that accepts input directly without opening an Activity. The current Activity-based flow keeps working on all API levels, so this change is purely additive.

---

## Stage Summary & Timeline

| Stage | Name | Estimated Days |
|---|---|---|
| 0 | Scaffolding & Infrastructure | 2–3 |
| 1 | Authentication & Profiles | 2–3 |
| 1.5 | Social Login (Google OAuth) | 1 |
| 2 | Products Catalog | 3–4 |
| 3 | Shopping Lists Core | 5–7 |
| 4 | Real-time Sharing | 3–4 |
| 5 | Recipes | 5–7 |
| 6 | Events | 5–6 |
| 7 | PWA & Polish | 3–4 |
| 8 | QA & Launch | 2–3 |
| 9 | Events Enhancements | 4–5 |
| 10 | Performance Optimization | 2–3 |
| 11 | Theming & Appearance | 3–4 |
| 12 | Android App & Widget (Quick Add) | 4–6 |
| **Total** | | **~43–59 working days** |

> **Quick wins:** Stages 0–4 deliver a fully functional shared shopping list app in approximately **2 weeks** of focused work.
> The full app (shopping + recipes + events) is achievable in **4–6 weeks**.

---

## Future Phases (Post-MVP)

- **Product images** — upload from device, stored in Supabase Storage
- **AI recipe suggestions** — based on what is currently in your shopping lists
- **Barcode scanning** — add products by scanning supermarket barcodes
- **Native mobile app** — React Native / Expo with shared business logic
- **Recipe import from URL** — parse and import recipes from cooking websites
- **Budget tracking** — estimated cost per shopping list
- **Multiple households / groups** — separate workspaces per family unit

---

*Generated: April 2026*
