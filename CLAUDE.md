# Claude Code Instructions

## Branching Workflow

**Never work directly on `main`.** For every task or feature:

1. Create a dedicated side branch from `main` (e.g., `feat/stage-3-db-migration`, `fix/product-search-bug`).
2. Do all work on that branch.
3. When the task is complete, merge (or PR) back to `main`.

This applies to all sessions, agents, and subagents.

## Quality Gates (after every change)

After completing any change, always verify:

1. **Tests pass** — run `npm test` (Vitest) and ensure all tests are green.
2. **Lint is clean** — run `npm run lint` with zero errors.
3. **Formatting is clean** — run `npm run format` (or the project's formatter) and ensure no diffs remain.

### Commit order

- Feature/fix changes and lint+format fixes **must be in separate commits**.
- Commit the feature/fix first, then commit any lint/format-only changes in a follow-up commit with a message like `style: lint and format fixes`.
