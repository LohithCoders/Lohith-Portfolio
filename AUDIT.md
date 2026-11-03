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
