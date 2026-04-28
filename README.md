# My To-Do App

## Project Overview

My To-Do App is a simple task management platform that helps users create, organise, track, and complete their daily tasks.

The goal is to build a clean and easy-to-use app where users can manage personal or work-related tasks in one place.

## Main Goal

Build a working MVP of a to-do app where users can:

- Add new tasks
- View all tasks
- Mark tasks as complete
- Edit tasks
- Delete tasks
- Organise tasks by status or category

## Target Users

This app is intended for:

- Students
- Professionals
- Small business owners
- Anyone who wants a simple way to manage daily tasks

## Key Features

### Phase 1: MVP

- Simple landing page
- Task dashboard
- Add task
- Edit task
- Delete task
- Mark task as complete
- Filter tasks by status: All, Active, Completed
- Local-only settings panel:
  - Default filter on load (`All`, `Active`, `Completed`)
  - Confirm before delete toggle
  - Compact task spacing toggle

### Phase 2

- Due dates
- Priority levels
- Categories or tags
- User accounts
- Reminders
- Mobile-friendly layout

## Current Status

This project is in MVP implementation with local persistence and basic settings complete.

Paperclip AI is being used to help plan, structure, and build the app step by step.

## Automated Browser QA (TOD-11)

Playwright is used for automated browser QA with a static local server.

### Setup

```bash
npm install
npx playwright install chromium
```

### Run QA Locally

```bash
npm run qa:browser
```

Optional:

```bash
npm run qa:browser:headed
npm run qa:browser:report
```

### CI Pipeline

- GitHub Actions workflow: `.github/workflows/browser-qa.yml`
- Runs on pull requests and pushes to `main`
- Installs dependencies, installs Chromium, runs Playwright tests, uploads artifacts (`playwright-report`, `test-results`)

## Settings Behavior

- Settings are stored in browser `localStorage` under a separate settings key.
- `Default filter on load` is applied when the app initializes.
- `Confirm before delete` controls whether delete actions require confirmation.
- `Compact task spacing` changes task list density without changing CRUD behavior.
- `Reset defaults` restores settings to:
  - default filter: `all`
  - confirm delete: `true`
  - compact density: `false`

## Folder Structure

```text
docs/
Project planning documents, user flows, feature notes, and decisions.

README.md
Main project overview and setup guide.

goals.md
The main goals Paperclip should work towards.

tasks.md
The active task list for the project.
