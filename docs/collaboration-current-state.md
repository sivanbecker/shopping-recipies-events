# Collaboration & Permissions — Current State Analysis

Snapshot taken on 2026-04-16, before the collaboration & permissions upgrade on branch `feat/collab-permissions-upgrade`. This doc fixes a point-in-time baseline; changes in that upgrade will make parts of this outdated — a post-upgrade appendix will be added at the end of the work.

The app is a Vite + React SPA backed by Supabase. There is no traditional server API layer — every mutation is a direct Supabase call from React, with Row-Level Security (RLS) as the authorization boundary.

---

## 1. Current data model

### 1.1 Profiles — [001](../supabase/migrations/001_initial_schema.sql#L12-L18), [025](../supabase/migrations/025_profiles_avatar_url.sql)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK `auth.users`, unique, ON DELETE CASCADE |
| `display_name` | text | nullable |
| `avatar_url` | text | nullable (Google profile picture) |
| `preferred_language` | text | CHECK ('he','en'), default 'he' |
| `created_at` | timestamptz | default now() |

Auto-populated from `auth.users` via the `handle_new_user` trigger ([025:7-20](../supabase/migrations/025_profiles_avatar_url.sql#L7-L20)).

### 1.2 Shopping lists — [001:127-136](../supabase/migrations/001_initial_schema.sql#L127-L136)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | nullable |
| `owner_id` | uuid | FK `auth.users`, NOT NULL, ON DELETE CASCADE |
| `is_active` | boolean | default true |
| `is_archived` | boolean | default false |
| `is_missing_list` | boolean | default false |
| `created_at` / `updated_at` | timestamptz | `updated_at` kept fresh by `update_updated_at()` trigger ([001:263-273](../supabase/migrations/001_initial_schema.sql#L263-L273)) |

- **No `deleted_at`, no `deleted_by`.** Delete is a hard DELETE with cascade.
- `is_archived` is the only soft-hide mechanism and is NOT semantically the same as trash.

### 1.3 List members — [001:143-149](../supabase/migrations/001_initial_schema.sql#L143-L149)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `list_id` | uuid | FK `shopping_lists`, ON DELETE CASCADE |
| `user_id` | uuid | FK `auth.users`, ON DELETE CASCADE |
| `role` | text | CHECK ('owner','editor','viewer'), default 'editor' |

- Unique `(list_id, user_id)`.
- **Owner is NOT a row in `list_members`**; ownership is in `shopping_lists.owner_id`. The `get_list_members` RPC unions the owner in at read time ([025:27-52](../supabase/migrations/025_profiles_avatar_url.sql#L27-L52)).
- No `joined_at`, no `left_at`, no invitation state.

### 1.4 Shopping items — [001:195-207](../supabase/migrations/001_initial_schema.sql#L195-L207)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `list_id` | uuid | FK `shopping_lists`, CASCADE |
| `product_id` | uuid | FK `products`, RESTRICT |
| `quantity` | decimal | default 1 |
| `unit_id` | uuid | nullable FK `unit_types` |
| `is_checked` | boolean | default false |
| `added_by` | uuid | FK `auth.users`, NOT NULL |
| `recipe_id` | uuid | nullable FK `recipes` (added in 009) |
| `note` | text | nullable |
| `sort_order` | int | default 0 |
| `created_at` | timestamptz | default now() |

- **Missing:** `updated_at`, `last_edited_by`, `last_edited_at`, `completed_by`, `completed_at`.
- No trigger stamps mutation metadata on update.

### 1.5 Catalog (products / categories / unit_types / tools) — [001:53-122](../supabase/migrations/001_initial_schema.sql#L53-L122), [018](../supabase/migrations/018_create_tools_table.sql)

Not in scope for this upgrade. Noted for completeness: `products` has `created_by` attribution and an `is_shared` flag.

### 1.6 Recipes domain — [009](../supabase/migrations/009_recipes_schema.sql)

`recipes`, `recipe_ingredients`, `recipe_steps`. Recipes have `owner_id` + `is_shared` but **no membership table** — collaboration on recipes is global-read / owner-write only. Out of scope this pass.

### 1.7 Events domain — [019](../supabase/migrations/019_events_schema.sql), [020](../supabase/migrations/020_fix_events_rls.sql), [021](../supabase/migrations/021_fix_events_rls_recursion.sql), [022](../supabase/migrations/022_event_tabs_fields.sql)

`events`, `event_members` (role enum same as lists), `event_invitees`, `event_equipment`, `event_recipes`, `event_shopping_lists`. The role-gating story mirrors lists in parts (events UPDATE allows editor members since [020:155-162](../supabase/migrations/020_fix_events_rls.sql)), but SELECT was simplified to owner-only in [021](../supabase/migrations/021_fix_events_rls_recursion.sql) to break an RLS recursion cycle. Out of scope this pass; will reuse the same primitives when extended.

### 1.8 What does NOT exist today

- No `notifications` table.
- No `activity_log` / audit trail.
- No soft-delete columns (beyond `is_archived`).
- No `updated_at` / `last_edited_by` on `shopping_items`.
- No invitations / pending-member workflow.
- No role gating on shopping items RLS.

---

## 2. Current backend / API behavior

There is no REST / server-actions layer. All mutations are client Supabase calls; all authZ is RLS + one `SECURITY DEFINER` helper. One Edge Function (`suggest-product`) is unrelated to collaboration.

### 2.1 List CRUD — [ListsPage.tsx](../src/pages/Lists/ListsPage.tsx), [ListDetailPage.tsx](../src/pages/Lists/ListDetailPage.tsx)

| Op | Call | Enforcement |
|---|---|---|
| Create | `.insert({ name, owner_id: user.id })` at [ListsPage.tsx:98-104](../src/pages/Lists/ListsPage.tsx#L98-L104) | RLS: `owner_id = auth.uid()` |
| Read | `.select('*').eq('id', listId)` at [ListDetailPage.tsx:521-530](../src/pages/Lists/ListDetailPage.tsx#L521-L530) | RLS: owner or `is_list_member()` |
| Rename | `.update({ name })` inline | RLS: **owner only** (editor cannot rename today — contradicts stated requirement) |
| Archive | `.update({ is_archived: true, is_active: false })` at [ListDetailPage.tsx:683-698](../src/pages/Lists/ListDetailPage.tsx#L683-L698) | RLS: owner only |
| Delete | `.delete().eq('id', id)` at [ListDetailPage.tsx:726](../src/pages/Lists/ListDetailPage.tsx#L726) | RLS: owner only. **Hard delete with CASCADE to items.** No warning dialog. |

### 2.2 Item CRUD — [ListDetailPage.tsx](../src/pages/Lists/ListDetailPage.tsx)

| Op | Call | Enforcement |
|---|---|---|
| Add | `.insert({ list_id, product_id, quantity, unit_id, added_by })` at [227-255](../src/pages/Lists/ListDetailPage.tsx#L227-L255). Upserts into an existing unchecked row for the same product. | RLS: `added_by = auth.uid()` and owner-or-member |
| Edit | `.update({ quantity, unit_id, note })` at [238-248](../src/pages/Lists/ListDetailPage.tsx#L238-L248) | RLS: owner-or-member. **No role gating.** |
| Toggle | `.update({ is_checked })` at [647-668](../src/pages/Lists/ListDetailPage.tsx#L647-L668). Optimistic update via `togglingIds` set. | Same |
| Delete | `.delete().eq('id', itemId)` at [670-681](../src/pages/Lists/ListDetailPage.tsx#L670-L681). **No confirm, no undo.** | Same |

No concurrency primitives — no `updated_at` stamp on items, no version, no `If-Match`. Simultaneous edits collide silently.

### 2.3 Sharing / invite — [ShareListDialog.tsx](../src/pages/Lists/ShareListDialog.tsx)

| Op | Call | Enforcement |
|---|---|---|
| Fetch members | RPC `get_list_members(p_list_id)` at [ShareListDialog.tsx:25-29](../src/pages/Lists/ShareListDialog.tsx#L25-L29) | SECURITY DEFINER (bypasses RLS); unions owner in |
| Look up user by email | RPC `find_user_by_email(p_email)` at [ShareListDialog.tsx:40-42](../src/pages/Lists/ShareListDialog.tsx#L40-L42) | SECURITY DEFINER — **unauthenticated with respect to list context**: any authenticated user can probe any email to find the user id. User-enumeration primitive. |
| Add member | `.insert({ list_id, user_id, role })` at [51-56](../src/pages/Lists/ShareListDialog.tsx#L51-L56) | RLS: `is_list_owner(list_id)` only |
| Change role | `.update({ role })` at [87-105](../src/pages/Lists/ShareListDialog.tsx#L87-L105) | Same — owner only |
| Remove member | `.delete().eq('id', memberId)` at [75-85](../src/pages/Lists/ShareListDialog.tsx#L75-L85) | RLS: `is_list_owner(list_id)` **or** `user_id = auth.uid()` (member can remove self) |

UI lets any authenticated user open the dialog — it is only soft-gated by the "Share" button visibility; a non-owner who opens it would see RLS denials on mutations but could still probe email addresses via the RPC.

### 2.4 Leave list

- **No UI exists.** The "Owner can manage memberships" policy at [004:64-67](../supabase/migrations/004_fix_rls_recursion.sql#L64-L67) is `FOR ALL USING is_list_owner(list_id)`. By policy this would not allow a non-owner to DELETE their own row; however policy evaluation for DELETE checks USING, and since members are also restricted by the same policy, **a member cannot leave via direct DB call today either**. This is a bug: the RLS is stricter than the product intent.

### 2.5 AuthN / AuthZ model

- Supabase `authenticated` role is the primary gate.
- Helpers (SECURITY DEFINER): `is_list_owner(uuid)`, `is_list_member(uuid)` in [004](../supabase/migrations/004_fix_rls_recursion.sql); `find_user_by_email(text)`, `get_list_members(uuid)` in [005](../supabase/migrations/005_find_user_by_email.sql) / [025](../supabase/migrations/025_profiles_avatar_url.sql).
- Realtime walrus cannot read `auth.uid()` through security-definer calls, so `shopping_items` SELECT was rewritten inline in [006](../supabase/migrations/006_fix_realtime_rls.sql).
- No per-role helper exists — the codebase cannot currently ask "what role is the caller in this list".

### 2.6 Conflict handling

- Nothing beyond "last write wins by row update order." No timestamps, no version columns, no optimistic concurrency.
- Realtime subscription in [ListDetailPage.tsx:562-643](../src/pages/Lists/ListDetailPage.tsx#L562-L643) sync caches in near-real-time but cannot prevent the underlying write races.

### 2.7 Notifications / activity infrastructure

- **None persistent.** The only realtime channel is `list-detail-{listId}` carrying postgres_changes + a custom `items-changed`/`list-changed` broadcast from [supabase.ts:32-35](../src/lib/supabase.ts#L32-L35).
- No notifications table, no audit log.
- Local `sonner` toasts ([main.tsx:19](../src/main.tsx#L19)) are the only user-facing feedback surface.

---

## 3. Current frontend behavior

### 3.1 Lists dashboard — [ListsPage.tsx](../src/pages/Lists/ListsPage.tsx)

- Card grid with list name, item count, member avatars via [AvatarStack.tsx](../src/components/AvatarStack.tsx). No shared-vs-personal badge; shared is inferred from avatar presence.
- Active/archived split collapsible. No "Trash" section.

### 3.2 List detail — [ListDetailPage.tsx](../src/pages/Lists/ListDetailPage.tsx)

- Header: list name, avatar stack, owner-only buttons `Convert` / `Share` / `Clone` / `Archive`. Delete is reached by the archive path, but a true delete happens at line 726 without a warning.
- Items list: each row uses the `ItemRow` component at [ListDetailPage.tsx:85-176](../src/pages/Lists/ListDetailPage.tsx#L85-L176), showing an avatar of `added_by`. **Not "last edited by"** — only the original adder is surfaced.
- No confirmation on item delete. No undo toast.
- Add-item flow: `AddItemSheet` modal, product search, quantity configuration.
- Shopping mode: larger checkboxes, no delete, grouped "In Cart" section.

### 3.3 Collaborator visibility

- In header via `AvatarStack` (owner shown with a ring).
- Full roster in `ShareListDialog` — but the dialog is the _owner_'s management dialog. There is no read-only collaborator view for non-owners (even though the Share button is already hidden from non-owners; the dialog itself has no guard).

### 3.4 Sharing flow — [ShareListDialog.tsx](../src/pages/Lists/ShareListDialog.tsx)

- Email-based invite using `find_user_by_email`.
- Role dropdown: `editor` / `viewer`. "Owner" is never selectable — ownership transfer is not implemented.
- Remove member button has no confirmation dialog.

### 3.5 Delete flow

- Hard delete called inline from `ListDetailPage`.
- No dialog, no affected-collaborator count, no soft-delete.

### 3.6 Item editing UX

- Quantity: modal-only (`AddItemSheet`), not inline. Stepper buttons for count units, free-form input for weight/volume.
- Mark done: checkbox with optimistic UI.
- Delete: trash-icon button (hidden in shopping mode); no confirm, no undo.

### 3.7 Undo

- **None exists.** `sonner` is wired up but no reverse mutation pattern is in place.

### 3.8 Notifications UI

- Nothing persistent. `sonner` toasts surface transient errors / successes only. No bell icon, no unread badge, no notification center.

### 3.9 Auth & state

- [AuthProvider.tsx](../src/hooks/AuthProvider.tsx) wraps the tree; `useAuth()` gives `user / session / profile`.
- Data layer: React Query + direct `supabase.from(...)` calls per component. No service/repository abstraction.
- Local UI state: Zustand ([useAppStore.ts](../src/store/useAppStore.ts)) for language and dark mode.

### 3.10 Realtime

- [ListDetailPage.tsx:560-643](../src/pages/Lists/ListDetailPage.tsx#L560-L643) subscribes to postgres_changes on `shopping_items` and `shopping_lists`, plus a custom broadcast channel. JWT is set with `setAuth(session.access_token)` before subscribe.
- No subscription on a notifications table (because none exists).

### 3.11 Confirm dialogs

- No centralized confirm component. Modal patterns are inlined (`fixed inset-0 z-50 flex items-center justify-center bg-black/40`).
- Events page and recipes page have their own confirm-delete dialogs; shopping items do not.

---

## 4. Risks & gaps (informed the upgrade plan)

1. **Viewers aren't actually read-only.** `shopping_items` RLS at [004:69-97](../supabase/migrations/004_fix_rls_recursion.sql#L69-L97) and [006](../supabase/migrations/006_fix_realtime_rls.sql) treats every `list_members` row as equal to the owner — any role can insert, update, delete.
2. **Editors can't rename.** `shopping_lists` UPDATE is owner-only, which contradicts the product intent that editors should be able to rename a shared list.
3. **Hard delete with no safety net.** No `deleted_at`, no warning dialog, no affected-count, no restore.
4. **No leave flow.** The "Owner can manage memberships" ALL policy at [004:64-67](../supabase/migrations/004_fix_rls_recursion.sql#L64-L67) is stricter than intended — even self-removal is blocked. UI doesn't offer it either.
5. **No attribution of edits.** Only `added_by` is tracked; a "who last edited this?" question can't be answered.
6. **No concurrency primitives.** Simultaneous quantity edits silently overwrite; users can't tell whose write won.
7. **No notification persistence.** Catch-up after reconnect is impossible; no unread UI.
8. **No undo** for item actions — delete is immediate and irreversible.
9. **User-enumeration primitive.** `find_user_by_email` is callable by any authenticated user without any list-scope gating.
10. **Stale UI after access revocation.** No client-side signal when a list is deleted or a user is removed — the detail page would sit empty until manual refresh.
11. **ShareListDialog isn't owner-guarded.** If a non-owner opens it (via direct route hack), they could still probe email addresses.
12. **Client-only validation for "already member."** Duplicate-membership is checked in client code at [ShareListDialog.tsx:48-50](../src/pages/Lists/ShareListDialog.tsx#L48-L50); the unique constraint on `(list_id, user_id)` catches it server-side, but a clean error message isn't surfaced consistently.
13. **Soft-deleted query hygiene.** When soft delete is introduced, every query against `shopping_lists` will need a `deleted_at is null` filter (or RLS will need to do it for non-owners); otherwise deleted lists leak into index views.

---

## 5. How this informs the upgrade plan

The upgrade plan at [/Users/sbecker/.claude/plans/toasty-noodling-giraffe.md](~/.claude/plans/toasty-noodling-giraffe.md) directly addresses each gap above:

- Gaps 1–2, 4 → new `list_member_role()` helper + role-aware RLS + column-level trigger on list metadata (Phase 1).
- Gaps 3, 13 → `deleted_at` soft-delete columns, SELECT-policy filter, a `TrashPage`, a scheduled purge (Phase 1–4).
- Gap 5 → new attribution columns stamped by server triggers (Phase 1–2).
- Gap 6 → `updated_at` stamped by trigger, last-editor surfaced in UI. Still last-write-wins, but attributable.
- Gaps 7–8 → `notifications` table + triggers + in-app bell + persisted unread state (Phase 2, 4); client undo toast pattern (Phase 5).
- Gap 9 → narrow `find_user_by_email` to require a `p_list_id` the caller owns.
- Gaps 10–11 → stale-state redirect in `ListDetailPage`; owner-only gating for `ShareListDialog`; read-only `CollaboratorsDialog` for non-owners.
- Gap 12 → handled incidentally by the server-side uniqueness constraint; existing client check remains a pre-validation.

The existing helpers (`is_list_owner`, `is_list_member`, `update_updated_at()`, `get_list_members`) and UI primitives (`UserAvatar`, `AvatarStack`, `sonner`, React Query, Realtime) are reused rather than replaced.

---

## 6. Post-upgrade appendix

_To be filled in after the branch is merged. Will include:_

- Final permission matrix (owner / editor / viewer).
- New RLS policy listing and helper function signatures.
- Notification type enum.
- Trash retention + purge mechanism.
- Verified end-to-end behavior per the plan's test script.
