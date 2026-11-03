# Phase 0 audit — Lohith: Beyond the Interface

Date: 2026-11-03
Decision: **REBUILD CLEAN** on branch `rebuild`.

## Baseline commands and evidence

- `npm install --ignore-scripts --no-audit --no-fund --verbose` exited 0 (`up to date in 2s`) but logged `npm http fetch GET https://registry.npmjs.org/npm attempt 1 failed with ENOTFOUND`. It did not reliably refresh dependencies.
- `npm list next react react-dom three @react-three/fiber @react-three/drei --depth=0`:
  - next 16.4.4
  - react 18.3.1; react-dom 18.3.1
  - three 0.171.0
  - @react-three/fiber 8.18.0; @react-three/drei 9.122.0
- Compatibility: Fiber v8 belongs with React 18, while the project requirement selects React 19. Next 16.4.4 emits: `React 18 support is deprecated in Next.js 16 and will be removed in Next.js 17.` Pin one verified matrix during Phase 1. Drei 9 with Fiber 8 is not the primary failure; align it to a documented compatible release during rebuild.
- `npm run lint`: fails, `Missing script: "lint"`.
- `npm run typecheck`: passes (`tsc --noEmit`, exit 0).
- `npm run build`: fails prerendering `/`; `TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`; build worker exits code 1. Existing dev log also records `ReactCurrentOwner` in `src/components/universe-page.tsx:2`.
- `npm run test` and `npm run e2e`: not defined in package.json (confirmed by package inspection; baseline commands are recorded as missing scripts).
- `npm run dev`: Next says port 3000 is occupied by an unknown process; a second server reports port 3001 ready, then exits because another Next dev server is already running. Direct HTTP probes to localhost:3000 were denied by sandbox socket permissions.
- Playwright browser startup fails because Chrome is absent at the configured path. Chrome DevTools reports no Google Chrome executable. No route crawl, screenshots, or browser network/console capture could be completed.

## Files and architecture findings

- `src/components/universe-page.tsx`: a 13.6 KB monolithic client component mixes page content, Canvas scene, route state, project detail, and navigation. Contains `any` types. Canvas is mounted on the home page rather than in the persistent app layout; route changes do not provide the required multi-page scene architecture.
- `src/data/portfolio.ts`: has content arrays, but relationships are inferred by technology-name equality and are not represented as explicit `{from,to,type}` edges; skills have duplicated category membership and project schema is incomplete.
- `src/app/page.tsx`: only page route. Required `/about`, `/skills`, `/skills/[slug]`, `/projects`, `/projects/[slug]`, `/experience`, `/achievements`, `/leadership`, `/research`, and `/contact` route modules are absent. The visible single-page interactions mutate history for URLs Next cannot resolve on reload.
- `src/app/globals.css`: remote `@import` font request instead of `next/font`; no shared shell/skip link and no checked contrast evidence.
- `src/app/layout.tsx`: uses a placeholder canonical base `https://example.com`.
- `src/app/sitemap.ts` and `src/app/robots.ts`: also use `example.com`.
- Contact UI in `universe-page.tsx` uses an unimplemented `mailto:ADD_EMAIL_ADDRESS` placeholder, while API route is not connected to that form; no honeypot/rate limit/Zod validation.
- `package.json`: scripts for lint, test, and e2e absent; key versions use ranges rather than a deliberately pinned matrix.
- Git: workspace did not contain `.git` (`git status` reported `fatal: not a git repository`). No old commits are present to preserve. Phase 0 will initialize Git on `rebuild` and commit the audited starting files before replacing them.

## Decision rationale

REBUILD CLEAN is required: the foundational runtime crashes due to the dependency combination, the only page is a monolith needing substantial replacement, the Canvas is not persistent, required routes are absent, and the relationship graph is not explicit data. The current source will remain in the first Git commit on `rebuild` so the rebuild has a recoverable baseline.

## Browser audit limitation

The requested Playwright route crawl and 1440/390 screenshots could not run: Playwright could not find Chrome and Chrome DevTools could not find a Chrome executable. HTTP probes were denied by the environment socket policy. This is an environment limitation, not a passing browser gate. Re-attempt after an available browser runtime is confirmed.

## Phase 1 foundation checkpoint (2026-11-03)

Phase 1 implementation is present but its gate is **BROKEN**; Phase 2 has not started.

- Pinned the requested React 19 / R3F 9 / Drei 10 dependency matrix and added lint, typecheck, build, Vitest, and Playwright scripts.
- Added typed profile, skill, project, experience, achievement, leadership, research, entity, and relationship data; shared relationship helpers and integrity tests.
- Added the HTML route set, shared navigation/footer/breadcrumbs, metadata, sitemap/robots, and server-validated contact endpoint with optional Resend integration.
- Actual passing commands: `npm run lint`, `npm run typecheck`, and `npm run test` (1 test file, 5 tests).
- `npm audit --omit=dev --json` reported zero production dependency vulnerabilities after pinning PostCSS 8.5.32. The full install/audit output still reports 16 moderate development dependency advisories.
- `npm run build` failed twice after two focused fixes: initial Turbopack worker/CSS panic; after switching the documented scripts to Webpack, build failed with `EPERM: operation not permitted, mkdir 'C:\\PROJECTS\\Lohith Portfolio\\.next\\static\\chunks\\next\\dist'`.
- `npm run e2e` did not reach tests: Playwright browser installation is incomplete (`ENOENT` for its browser `.links` store), and the configured web server was blocked by an already-running Next process (PID 21300) from this workspace. No route crawl, screenshots, or browser console/network assertions have been executed.
- Exact dependency versions are pinned in `package.json`; the requested React/Fiber compatibility is React 19 + Fiber 9.8.2 + Drei 10.7.9.

**Gate result: BROKEN.** Production build and Playwright verification remain outstanding; no later phase may start until this gate passes.

### Follow-up retry after typography update

- Site-wide typography was increased in `src/app/globals.css`, including body copy, navigation, metadata labels, cards, form controls, and mobile text.
- Lint, typecheck, and Vitest were rerun and passed (1 test file, 5 tests).
- `npm run build` was retried and failed again with `EPERM` creating `.next/types/app/leadership`.
- One focused output-isolation attempt (`NEXT_DIST_DIR=.next-build npm run build`) compiled and typechecked but still wrote to `.next`, then failed prerendering `/projects` with `EPERM` creating `.next/server/app/projects.segments/projects`.
- Playwright browser automation was retried and confirmed Chrome is missing at `C:\\Users\\LOHITH\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`.
- At that checkpoint, the typography change had not yet received browser review. The following browser recheck supersedes that limitation for the earlier site state.

### Browser recheck (2026-11-03)

- Chrome is installed at `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe` (not the per-user default path). Playwright config points to that executable and starts a separate development server on port 3100.
- The connected Playwright browser successfully loaded `/`, `/about`, `/skills`, `/projects`, `/experience`, `/achievements`, `/leadership`, `/research`, and `/contact`; each returned HTTP 200.
- Captured `test-results/phase1-desktop.png` and `test-results/phase1-mobile.png`. Computed body font size is 17px at both viewports; mobile body scroll width was 375px with 375px client width (no horizontal overflow in the checked viewport).
- Route sweep reported no browser console or page errors. A separate initial homepage check did report a missing `/favicon.ico` (404).
- An earlier `npm run e2e` attempt could not start its webServer because the process received `listen EACCES` on loopback. App-route verification at that point was done through the connected browser instead.

### User content corrections and phase 1 recheck (2026-11-03)

- Updated education to B.Tech in Computer Science Engineering at KG Reddy College of Engineering and Technology; date remains TODO.
- Replaced the unverified project archive with seven public project repositories: RESUMATE-AI, TestPilot, STORYWEAVER-AI, CaptionCraft, air-quality-monitor, flashcard-app, and CarsInfo. The separate `LohithCoders` profile repository is not presented as a project. The About page orders the seven projects by latest public repository activity, newest to oldest (1 Nov 2026 through 24 Nov 2024). TestPilot is marked as the current academic major project. Repository READMEs distinguish simulated prototype features; the air quality and flashcard repos have blank READMEs, so their extra details remain TODO.
- Removed unverified internship/program experience entries and other unconfirmed clubs. Leadership now contains only Technical Secretary and PALS Student Leader, with image placeholders and responsibilities left TODO.
- Replaced the research-interest page content with TestPilot focus and five supplied technical writing links. Article titles and short summaries were checked against the live YTT pages; publication dates remain TODO.
- Updated email, GitHub and LinkedIn links; the resume remains a non-clickable placeholder. Added contact marks/icons. LinkedIn itself returned its sign-in wall in the browser, so only the user-specified corrections were used.
- Added a local SVG favicon after the browser reported `/favicon.ico` missing.
- Final `npm run lint`, `npm run typecheck`, and `npm run test` pass (1 test file, 5 tests).
- Connected browser route crawl returned HTTP 200 for all 37 primary, project-detail and skill routes. Desktop and mobile About screenshots were captured and inspected; body font is 17px and the mobile document had no horizontal overflow.
- `npm run e2e` remains blocked by the environment’s loopback socket restriction (`ERR_NETWORK_ACCESS_DENIED` / `EACCES`). The connected browser can reach the dev site, but the local Playwright process cannot connect to or start its server.
- Per the user's latest instruction, defer running the full Playwright E2E suite until all development phases are finished; focused browser checks already used for Phase 1 are not a substitute for the final suite.
- The earlier 37-route crawl and About screenshots predate the expanded seven-project timeline. A focused route check against the separate port 3100 dev server timed out from the connected browser bridge, so the seven new project detail pages have not yet received a browser smoke check.
- The latest clean `npm run build` attempt, with dedicated `.next-build` output and one static-generation worker, still failed with `EPERM` while creating `.next-build/server/app/achievements.segments/achievements`. Two focused build approaches (separate build output and single worker) have not cleared it.

### Phase 1 gate retry (2026-11-03)

- The standard sandboxed `npm run build` retries continued to fail with `EPERM` creating generated output under `.next-build`.
- `npm run build` passed when rerun with filesystem access outside the restricted runner: compilation, TypeScript, all 49 static pages, and build tracing completed; exit code 0. The output lists all expected primary routes and generated project/skill paths.
- `npm run lint` passed with filesystem access outside the restricted runner; `npm run typecheck` and `npm run test` passed in the normal runner (1 file, 5 tests).
- Full Playwright E2E remains deferred until development is complete per the user's instruction. Prior focused browser route checks covered 37 routes; seven project-detail pages added after that crawl still need a focused browser smoke check. This is not represented as a completed full crawl.
- `npm run start` warns that it is incompatible with `output: 'standalone'`; test the generated standalone server for route smoke checks and fix the start script during release preparation.

**Phase 1 code/build/unit-test gate: PASSED.** Focused browser smoke checks for the latest project routes and the full E2E suite remain outstanding; Phase 2 may proceed without claiming those browser checks passed.
