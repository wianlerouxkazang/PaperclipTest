# Supabase Setup for TOD-13 (Manual Prerequisite)

Date: 2026-04-28
Status: Required before implementation

## Goal

Prepare Supabase so the app can support:

- globally unique usernames
- cross-device task persistence
- centralized online task storage

No frontend coding should begin until this setup is complete.

## 1) Create Supabase Project

1. Open https://supabase.com/dashboard
2. Click `New project`
3. Choose org, project name, database password, and region
4. Wait for project provisioning to finish

## 2) Create Schema (SQL Editor)

Open SQL Editor and run:

```sql
create extension if not exists citext;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username citext not null,
  created_at timestamptz not null default now()
);

alter table public.users
  add constraint users_username_unique unique (username);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 120),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_completed_idx on public.tasks(user_id, completed);
```

## 3) RLS Setup (MVP)

Because this MVP has no passwords/OAuth yet, use permissive policies for now:

```sql
alter table public.users enable row level security;
alter table public.tasks enable row level security;

create policy "mvp_users_all" on public.users
for all to anon, authenticated
using (true) with check (true);

create policy "mvp_tasks_all" on public.tasks
for all to anon, authenticated
using (true) with check (true);
```

Important:
- This is MVP-only and not hardened security.
- Never expose `service_role` key in frontend code.

## 4) Find Required Project Values

### Supabase URL

Find in either:
- Project `Connect` dialog, or
- `Project Settings` -> `API`

Format:
- `https://<project-ref>.supabase.co`

### Supabase anon/public key

Find in:
- `Project Settings` -> `API Keys`

Use:
- `anon` key (legacy) or publishable key (preferred naming)

Do not use:
- `service_role` key in GitHub Pages/frontend

## 5) Values Required Before Coding Starts

Provide these exact values to the implementation agent:

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY` (or publishable key)
3. Confirmation schema SQL completed successfully
4. Confirmation RLS/policies applied
5. Supabase project region

## 6) Frontend Safety Note

Using the anon/public key in a GitHub Pages frontend is expected, provided RLS is enabled and policies are intentionally configured.

## References

- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/tables
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/secure-data
