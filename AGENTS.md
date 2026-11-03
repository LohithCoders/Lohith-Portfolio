# Repository instructions

## Required stack and commands
- Next.js App Router, strict TypeScript, React 19, Three.js, `@react-three/fiber`, `@react-three/drei`, GSAP, Framer Motion and Tailwind CSS.
- Vitest and Playwright are the test tools.
- Pin mutually compatible package versions. Check current framework and library docs with Context7 before relying on uncertain APIs.
- Required scripts: `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm run build`, `npm run test` (Vitest), `npm run e2e` (Playwright).
- Do not begin a phase until the preceding phase's gate passes. At phase end report DONE / BROKEN / NEXT, and commit the phase with a clear message.

## Architecture rules
1. Mount exactly one persistent `<Canvas>` from `app/layout.tsx` through a client component loaded with `next/dynamic` and `ssr:false`. Route pages must not unmount it. Read the route with `usePathname` and move the camera to route targets.
2. All authored content is typed data in `src/data/*.ts`. Every entity has unique `id` and `slug`; components contain no portfolio facts.
3. All cross-links live in `src/data/relationships.ts` as `{from,to,type}` edges. Components use `getRelated(id)` and `getBacklinks(id)`. Unit tests reject edges that reference missing IDs.
4. Every route has complete semantic HTML outside the canvas and works when WebGL is absent.
5. Use procedural Three.js geometry only; do not use remote model or texture URLs.
6. Dispose resources; instance repeated nodes; pause when hidden/offscreen; use `frameloop="demand"` where possible; cap interactive scene nodes at 60.
7. Browser-only code is isolated to client components. Avoid hydration warnings.
8. Secrets remain server-side in environment variables.
9. No `any`. Use small reusable components. Explain non-obvious code with brief comments only.
10. TODO facts/URLs are literal `TODO`, documented in `TODO.md`, and never rendered as clickable links. Never invent biographical facts, credentials, dates, project links, metrics, or results.
11. Keep the existing project history; rebuild on branch `rebuild`.
12. Do not claim commands, browser checks, screenshots, or metrics passed unless actually executed and observed.
13. User instruction (2026-11-03): defer the full Playwright E2E suite until all portfolio development phases are complete. During implementation, use focused visual or route checks only; run the full suite during final verification.

## Project workflow
- Phase 1: Foundation, typed data/edges, semantic routes, shared shell, metadata. Gate: lint, typecheck, build, Vitest, link crawl; relationship integrity and reciprocal project/skill links pass.
- Phase 2: Persistent 3D hub, camera and route sync. Gate: node navigation, history, Canvas identity, deep links, no console errors, 1440/390 reviewed screenshots.
- Phase 3: Skills/projects graph and map. Gate: Python → project → skill history path.
- Phase 4: Remaining content and contact. Gate: TODO states and contact validation/states verified.
- Phase 5: Responsive, performance, accessibility, SEO. Gate: all commands, browser variants and honest Lighthouse report.
- Phase 6: README and release report. Gate: production build and start work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
