---
name: add-category
description: Add one or more new categories to the DB with full git workflow (branch, migrate, push, PR, merge, rebase).
argument-hint: <category-name-he> [additional categories...]
user-invocable: true
allowed-tools: Bash, Read, Write, Glob, Grep
---

Add one or more new Hebrew categories to the shopping app database, following the full branching and migration workflow.

## Categories to add

$ARGUMENTS

## Instructions

Execute the following steps exactly, in order. Do not skip any step.

### Step 1 — Ensure a clean starting point

1. Run `git status` and `git branch --show-current` to know the current state.
2. **If on a side branch:**
   - Check for uncommitted changes (`git status --short`).
   - If there are uncommitted changes, **stop and tell the user** — do not stash or commit on their behalf.
   - If the branch is clean, switch to main: `git checkout main`.
3. **If on main (or after switching to main):**
   - Pull latest: `git pull origin main`.
   - Confirm the pull succeeded before continuing.

### Step 2 — Create a side branch

- Derive a branch name from the first category argument: lowercase, replace spaces/Hebrew with a transliterated slug if needed, prefix with `feat/add-category-`.
- Example: input `ממרחים` → branch `feat/add-category-spreads`, input `פירות` → `feat/add-category-fruits`.
- Run: `git checkout -b <branch-name>`.

### Step 3 — Create the migration file

1. List `supabase/migrations/` and find the highest-numbered prefix (e.g., `013`). The new file gets the next number (e.g., `014`).
2. Determine the next `sort_order` by finding the highest `sort_order` value across all migration files in `supabase/migrations/`. Increment from there.
3. For each category in `$ARGUMENTS`, pick an appropriate icon (emoji) and color (hex). Use judgement based on the category name.
4. Write the migration file `supabase/migrations/<NNN>_add_<slug>_category.sql`:

```sql
-- Migration <NNN>: Add <category name(s)> category

INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('<name_he>', '<name_en>', '<icon>', '<color>', <sort_order>)[, ...];
```

   - `name_he`: Hebrew name as provided.
   - `name_en`: English translation.
   - `icon`: fitting emoji.
   - `color`: hex color that doesn't clash with existing categories.
   - `sort_order`: sequential, starting after the current max.

5. Show the user the file content and ask for confirmation before continuing.

### Step 4 — Apply migration to DB

Run:
```
supabase db push
```

If it fails, show the error to the user and stop.

### Step 5 — Commit, push, open PR, and merge

1. Stage the new migration file: `git add supabase/migrations/<file>`.
2. Commit: `git commit -m "feat: add <category name(s)> category"`.
3. Push: `git push -u origin <branch-name>`.
4. Create PR:
```
gh pr create --title "feat: add <category name(s)> category" --body "Adds the <category name(s)> category to the categories table via migration."
```
5. Merge the PR immediately:
```
gh pr merge --merge
```

### Step 6 — Update local main and rebase previous branch (if any)

1. Record the name of the branch that was active before Step 1 (if it was a side branch, not main).
2. Switch back to main and pull: `git checkout main && git pull origin main`.
3. If a previous side branch was recorded:
   - Rebase it onto updated main: `git checkout <previous-branch> && git rebase main`.
   - If rebase conflicts occur, tell the user and stop — do not resolve automatically.
4. Report the final state clearly: current branch, whether rebase was done, and confirmation that main is up to date.
