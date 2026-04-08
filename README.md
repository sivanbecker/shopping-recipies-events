# Shopping · Recipes · Events

A mobile-first collaborative web app for managing shopping lists, recipes, and family/social events. Supports Hebrew (RTL) and English (LTR).

## Stack

React 18 + TypeScript + Vite · Tailwind CSS + shadcn/ui · Supabase (auth, DB, realtime) · TanStack Query · i18next

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase URL and anon key
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Lint (zero warnings policy) |
| `npm run format` | Format with Prettier |

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Get these from [supabase.com/dashboard](https://supabase.com/dashboard) → your project → Settings → API.

## Docs

- [Full setup guide](docs/SETUP.md)
- [Project plan](docs/PROJECT_PLAN.md)
- [Progress log](docs/PROGRESS.md)
