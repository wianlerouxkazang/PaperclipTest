# Project Decisions

This file records important decisions made during the project.

## Decisions

- The project is a simple to-do app.
- The first version will focus on MVP features only.
- Advanced features will be added later.

## MVP Build Decisions (2026-04-28)

- Implementation uses plain `index.html`, `styles.css`, and `app.js` to keep the MVP simple and easy to iterate.
- Tasks are stored in browser `localStorage` under a single key so users keep data across refreshes without backend work.
- Task model for this build: `id`, `title`, `completed`, `createdAt`.
- Edit action uses a browser prompt and delete action uses browser confirmation to avoid adding UI complexity in this phase.
- Filters are limited to `All`, `Active`, and `Completed` exactly as defined in MVP scope.

## QA and Basic Polish Decisions (2026-04-28)

- Changed filter container semantics from `tablist` to `group` to better match button-style filter controls.
- Added visible keyboard focus styles for inputs and buttons to improve baseline usability.
- Empty-state message now changes by active filter (`All`, `Active`, `Completed`) for clearer UX.
- Kept edits minimal and within current MVP scope; no new product features were introduced.

## Automated Browser QA Decision (2026-04-28)

- Adopted Playwright as the MVP browser QA framework because it supports stable end-to-end flows and CI artifact capture with minimal setup.
- Scope for TOD-11 remains MVP: cover core task lifecycle and a critical settings behavior (delete confirmation persistence) without introducing product features.
- Added GitHub Actions browser QA workflow to run on pull requests and `main` pushes so regressions are caught before merges.

## TOD-13 Board Decision: Hosted Backend with Supabase (2026-04-28)

- Board approved Option C (hosted backend service) and selected Supabase.
- Reason: local-only `localStorage` does not satisfy cross-device persistence or global username uniqueness.
- Product/architecture scope approved:
  - Use Supabase as central task storage.
  - Enforce globally unique usernames.
  - Allow same user to access same task list from any device.
  - Keep current GitHub Pages frontend.
  - Keep current localStorage approach only as fallback.
- Explicitly out of scope for this phase:
  - Passwords, OAuth, MFA
  - Payments
  - Advanced user profiles
  - Complex security hardening beyond MVP needs

## TOD-13 Pre-Build Implementation Plan (Confirmed, No Code Yet)

- CEO coordination outcome:
  - Split planning into CPO acceptance criteria and CTO technical design.
  - Require Lead Engineer file-change map and QA cross-device-style test plan before implementation.

- CPO acceptance criteria:
  - Username sign-in works on any device with the same username.
  - Username creation/sign-in flow blocks duplicate usernames globally.
  - Tasks persist in Supabase and reload consistently across sessions/devices.
  - Task CRUD and filters continue to work with the existing simple UI.
  - If Supabase request fails, user sees a clear inline error and no silent data loss.

- CTO schema and integration approach:
  - Tables:
    - `users`: `id uuid pk`, `username text unique not null`, `created_at timestamptz default now()`
    - `tasks`: `id uuid pk`, `user_id uuid not null fk users(id)`, `title text not null`, `completed boolean default false`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - Constraints/indexes:
    - Unique index on `users.username` (case-insensitive via normalized lowercase write path in app).
    - Index on `tasks.user_id`.
  - Frontend integration:
    - Add Supabase JS client in frontend.
    - Replace task/settings local-only persistence path with Supabase-first reads/writes for signed-in user.
    - Keep localStorage fallback path gated for failure/offline contingency only.

- Lead Engineer file-change map (planned):
  - `index.html`: add Supabase client script include and minimal status/error region if needed.
  - `app.js`: add Supabase config/init, username upsert/sign-in flow, remote task CRUD sync, fallback handling.
  - `styles.css`: style any new inline sync/error/loading states.
  - `tests/browser/todo-app.spec.js`: extend tests for multi-session persistence behavior and duplicate-username handling.
  - `README.md`: add Supabase setup/env instructions and fallback behavior notes.

- QA browser test plan (planned):
  - Username uniqueness test:
    - first sign-in creates user; second create attempt with same username path is handled deterministically (sign-in to existing user, no duplicate account).
  - Cross-session persistence simulation:
    - add tasks, reload/new context, sign in with same username, verify tasks persist.
  - CRUD persistence:
    - create/edit/complete/delete task and verify state persists after reload.
  - Failure mode:
    - simulate backend failure and verify visible error without destructive overwrite.

- Rule confirmed:
  - Do not implement code changes for Supabase until this plan is accepted for execution.
  - Manual environment setup prerequisites are documented in `docs/supabase-setup.md`.
