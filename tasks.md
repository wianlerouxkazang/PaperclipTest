# Active Tasks

## To Do

- Gather feedback for post-MVP improvements

## In Progress

- Run TOD-10 validation pass:
  - settings persistence and load behavior
  - delete confirmation toggle behavior
  - compact mode visual density behavior
  - mobile settings panel usability

## Done

- README.md created
- GitHub repository connected to Paperclip
- Confirm MVP features
- Create basic product requirements
- Create simple user flow
- Decide tech stack
- Build task dashboard
- Add task creation
- Add task completion
- Add task editing
- Add task deletion
- Add task filters
- Add localStorage save/load
- Add empty state and basic clean styling
- Apply basic QA polish: filter semantics, focus visibility, clearer empty-state messages
- TOD-10 implementation:
  - add settings entry point and panel UI
  - persist settings (`defaultFilter`, `confirmDelete`, `compactDensity`)
  - apply default filter on load
  - gate delete confirmation by settings
  - apply compact density class on app container
  - add settings save/reset with inline success/error messaging
  - update styles and responsive behavior for settings
- TOD-11 Add Automated Browser QA Pipeline:
  - add Playwright test tooling and config (`playwright.config.js`, `tests/browser`)
  - add browser QA npm scripts (`qa:browser`, `qa:browser:headed`, `qa:browser:report`)
  - add GitHub Actions workflow for browser QA on PRs and `main` pushes
  - publish run instructions in README and CI artifact behavior
