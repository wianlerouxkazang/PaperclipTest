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
