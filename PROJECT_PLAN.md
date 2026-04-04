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
| **Authentication** | Supabase Auth | Email + password, JWT sessions |
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
- [ ] Add `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
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

#### 2.5 — Bulk Import from CSV / JSON (Frontend)
- [ ] Add an "Import" button to the `/products` page toolbar
- [ ] File picker accepts `.csv` and `.json` files
- [ ] CSV format:
  ```
  name_he,name_en,category,default_unit
  חלב,Milk,Dairy,liter
  לחם,Bread,Bakery,unit
  ```
- [ ] JSON format: array of objects with the same fields (`name_he`, `name_en`, `category`, `default_unit`)
- [ ] Parse and validate rows client-side (Zod schema): require `name_he`, skip malformed rows with a warning
- [ ] Resolve `category` name → `category_id` and `default_unit` code → `default_unit_id` by matching against data already fetched from Supabase
- [ ] Batch `INSERT` via `supabase.from('products').insert([...])` — single call, all valid rows
- [ ] Show import summary dialog after completion: "X imported, Y skipped" with reasons for skipped rows
- [ ] Skipped rows can be downloaded as a CSV for correction and re-import

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
- [ ] Unknown category or unit in CSV → row is skipped with a clear reason

#### Automated Tests
- [ ] Unit: `ProductCard` renders with correct name and category
- [ ] Unit: search filter function filters array correctly
- [ ] Unit: CSV/JSON parser rejects rows missing `name_he` and returns structured error list
- [ ] Unit: category/unit name → UUID resolution handles unknown values gracefully
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

#### 4.2 — Supabase Realtime Subscriptions
- [ ] Subscribe to `shopping_items` changes when a list is opened
- [ ] Subscribe to `shopping_lists` changes (name, active status)
- [ ] Optimistic updates: update local state immediately, sync in background
- [ ] Conflict resolution: last-write-wins for checked status

#### 4.3 — Presence Indicators
- [ ] Use Supabase Presence to show who is currently viewing the same list
- [ ] Display avatar initials in the list header: "2 people viewing"

#### 4.4 — In-App Notifications
- [ ] Toast notification when another user adds an item to a shared list you are viewing
- [ ] Unread badge on a list card when items were added while you were away

#### Stage 4 Manual Testing Checklist
- [ ] Open the same list on two browser tabs → add item in one → appears in the other within 1 second
- [ ] Check an item in one session → immediately reflects in the other session
- [ ] Invite a user by email → the list appears in their `/lists` page
- [ ] Remove a user from the list → they lose access immediately
- [ ] Presence avatars appear when two users view the same list

#### Automated Tests
- [ ] Unit: RLS policies — User A cannot read User B's private list
- [ ] Unit: list member role permission checks
- [ ] E2E: Two-user scenario — share list, both add items, verify sync via Supabase Realtime

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

#### Stage 6 Manual Testing Checklist
- [ ] Create an event set for next week → countdown shows correct number of days
- [ ] Add 5 guests, mark 2 as needing transport, assign a driver to each
- [ ] Add a checklist item (e.g., "12 chairs") and mark as arranged
- [ ] Attach a recipe to the event → servings default to guest count
- [ ] Generate shopping list from recipes → all ingredients appear with correct quantities
- [ ] Link an existing shopping list to the event → it shows in the Shopping section
- [ ] Past events appear in the past section
- [ ] Countdown updates correctly relative to today

#### Automated Tests
- [ ] Unit: countdown calculation (days until a given date)
- [ ] Unit: shopping list merge/deduplication logic for the combined list generator
- [ ] Unit: transport assignment options only include available people
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
- [ ] Skeleton loaders for all data-fetching states
- [ ] Empty states with friendly inline SVG illustrations
- [ ] Error boundaries per page section
- [ ] Pull-to-refresh on mobile (lists overview page)
- [ ] Swipe left on a list item to reveal delete (mobile)
- [ ] Subtle press animations on interactive elements

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

## Stage Summary & Timeline

| Stage | Name | Estimated Days |
|---|---|---|
| 0 | Scaffolding & Infrastructure | 2–3 |
| 1 | Authentication & Profiles | 2–3 |
| 2 | Products Catalog | 3–4 |
| 3 | Shopping Lists Core | 5–7 |
| 4 | Real-time Sharing | 3–4 |
| 5 | Recipes | 5–7 |
| 6 | Events | 5–6 |
| 7 | PWA & Polish | 3–4 |
| 8 | QA & Launch | 2–3 |
| **Total** | | **~30–41 working days** |

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
- **Dark mode**
- **Multiple households / groups** — separate workspaces per family unit

---

*Generated: April 2026 | Contact: sivanbecker@gmail.com*
