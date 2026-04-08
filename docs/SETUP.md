# Getting Started

Follow these steps to run the app locally after cloning or copying this folder.

---

## 1. Install Dependencies

Open a terminal in this folder and run:

```bash
npm install
```

This installs React, Supabase, Tailwind, i18next, and all other packages listed in `package.json`.

---

## 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and give it a name (e.g. "shopping-app")
3. Wait for the project to finish provisioning (~1 minute)
4. Go to **Settings → API** and copy:
   - **Project URL**
   - **anon / public key**

---

## 3. Set Up Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. Run Database Migrations

In the Supabase Dashboard, go to **SQL Editor** and run the migration files in order:

1. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` → click **Run**
2. Copy and paste the contents of `supabase/migrations/002_seed_data.sql` → click **Run**

This creates all tables, enables Row Level Security, and seeds categories + unit types.

---

## 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Run Tests

```bash
# Unit tests
npm run test

# E2E tests (requires dev server to be running)
npm run test:e2e
```

---

## 7. Deploy to Vercel

1. Push the project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → import from GitHub
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy** — Vercel handles the rest automatically

---

## Project Structure

```
src/
├── __tests__/        Unit tests
├── components/
│   ├── layout/       Header, BottomNav, AppLayout
│   └── ProtectedRoute.tsx
├── hooks/
│   └── useAuth.tsx   Authentication context + hook
├── lib/
│   ├── supabase.ts   Supabase client
│   ├── queryClient.ts TanStack Query config
│   └── utils.ts      Shared utility functions
├── locales/
│   ├── he/           Hebrew translations (RTL)
│   └── en/           English translations
├── pages/
│   ├── Auth/         Login + Register (Stage 1)
│   ├── Lists/        Shopping lists (Stage 3)
│   ├── Products/     Product catalog (Stage 2)
│   ├── Recipes/      Recipes (Stage 5)
│   ├── Events/       Events (Stage 6)
│   └── Profile/      User profile (Stage 1)
├── store/
│   └── useAppStore.ts Zustand global state
├── types/
│   ├── database.ts   Supabase DB types
│   └── index.ts      App-level type aliases
├── i18n.ts           i18next configuration
└── App.tsx           Route definitions
supabase/
└── migrations/       SQL migration files
e2e/                  Playwright E2E tests
```

---

## Implementation Roadmap

See `PROJECT_PLAN.md` for the full stage-by-stage implementation plan.

| Stage | Feature | Status |
|---|---|---|
| 0 | Project scaffold (this file) | ✅ Done |
| 1 | Auth + Profiles | 🔜 Next |
| 2 | Products Catalog | 🔜 |
| 3 | Shopping Lists | 🔜 |
| 4 | Real-time Sharing | 🔜 |
| 5 | Recipes | 🔜 |
| 6 | Events | 🔜 |
| 7 | PWA + Polish | 🔜 |
| 8 | QA + Launch | 🔜 |
