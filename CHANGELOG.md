# Changelog

## 2026-11-03
- Phase 0 audit recorded in `AUDIT.md`.
- Decision: clean rebuild on `rebuild`; original workspace had no Git history.
- Added repository architecture and phase gate instructions in `AGENTS.md`.
- Added missing user/profile facts and URLs to `TODO.md`.
- Phase 1 foundation checkpoint: added typed centralized content/relationship data, HTML routes and shared shell, SEO metadata endpoints, contact API, and required npm scripts.
- Phase 1 gate remains BROKEN: lint, typecheck, and Vitest passed; production build hit `EPERM` after two focused fixes; Playwright could not start due unavailable browser store and an already-running workspace Next server. Phase 2 was not started.
- Increased the typography scale across the shared site styles. Lint, typecheck, and Vitest pass again. Additional build attempts still fail with filesystem `EPERM`; browser automation confirmed Chrome is missing, so visual review is pending and Phase 1 remains blocked.
- Applied the user’s content corrections: updated CSE education, rebuilt the project timeline from seven public project repositories, removed unverified experience entries, limited leadership to Technical Secretary and PALS Student Leader with image placeholders, replaced Research Interests with TestPilot academic focus and five linked articles, and added supplied contact links/icons. Added a favicon.
- Rechecked Phase 1: lint, typecheck and Vitest pass; connected browser returned 200 for 37 routes and reviewed About screenshots at desktop/mobile. Build still fails creating a Next route-segment output directory with `EPERM`; local Playwright is blocked by loopback socket restrictions. Phase 2 remains unstarted and Phase 1 is not committed as complete.
- Full Playwright E2E is deferred until all development phases are complete per the user's latest instruction; the final test run will happen at release verification.
- Expanded the verified GitHub-based project dataset to seven repositories, ordered by latest commit activity, and added Vite to the skill graph. Lint, typecheck and Vitest pass after the data update. The connected browser timed out on port 3100, so expanded project routes remain browser-unverified.
- Phase 1 gate retry: production build succeeded with filesystem access outside the restricted runner (49 static pages); lint, typecheck, and Vitest pass. The ordinary sandbox build remains blocked by filesystem `EPERM`. Full Playwright E2E remains deferred as requested; Phase 1 build/unit gate passed and Phase 2 may proceed while the focused seven-project route smoke check is outstanding.
