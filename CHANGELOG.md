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

### Phase 2 hub and persistent canvas (2026-11-04)

- Added one persistent client-only React Three Fiber Canvas in the root layout, procedural identity core, eight navigable hub nodes, connections, particles, pointer/focus affordances, reduced-motion and low-power fallback behavior, route-synchronized GSAP camera targets, and animated page transitions.
- Focused production browser checks: all eight accessible hub links were navigated in the preceding Phase 2 verification, preserving the same Canvas DOM node; browser history and direct `/projects/testpilot-ai` loading worked. Current production home has one Canvas and no horizontal overflow; TestPilot direct route has the expected page title and heading.
- Captured production viewport screenshots at 1440x900 and 390x844. At the connected browser's 390px request, its reported CSS viewport was 375px and document scroll width was also 375px; no horizontal overflow was measured.
- `npm run lint`, `npm run typecheck`, and `npm run test` pass (1 test file, 5 tests). Sandboxed `npm run build` hit Windows `EPERM`; rerunning with filesystem access succeeded, compiling, typechecking, generating 49 static pages, and completing traces (exit 0).
- Changed `npm run start` to serve Next's standalone output and updated the build script to copy static/public assets. `npm run start` announced Ready; the connected browser loaded the production home and TestPilot route. Home had zero console errors and one upstream `THREE.Clock` deprecation warning from the bundled React Three Fiber runtime.
- Full `npm run e2e` remains deferred until all portfolio development phases are complete per user instruction. No full E2E result is claimed.

**Phase 2 implementation/build/unit gate: PASSED.** Focused production route and Canvas checks passed; the full Playwright suite remains intentionally outstanding.

### Phase 3 skills and projects map (2026-11-04)

- Added a relationship-driven map overlay to the Skills and Projects routes. Visitors can select a skill, inspect connected projects, then follow a project to its recorded skills or detail page. The map uses existing relationship data and native dialog behavior, including Escape dismissal.
- Focused production browser check at 390×844 confirmed the overlay stayed within the viewport with no horizontal overflow. React → TestPilot AI → Vite was verified through the map. No browser errors were observed; Three.js emitted its existing upstream `THREE.Clock` deprecation warning.
- `npm run lint`, `npm run typecheck`, `npm run test` (5 tests), and `npm run build` passed. The sandboxed build attempt hit Windows `EPERM`; the retry with filesystem access completed successfully and generated 49 pages.
- The required Python → project → skill path is not represented by current verified relationships: no project currently lists Python in its related skills. Python remains selectable and the map accurately reports that it has no linked project. Do not add that edge until the project association is verified.
- Full Playwright E2E remains deferred until all portfolio development phases are complete per user instruction.

**Phase 3: BROKEN —** the relationship map implementation and build checks are complete; the required Python relationship path remains unresolved.
