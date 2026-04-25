# Task 5 TDD Log

## RED

Command run before the router implementation existed:

```bash
npm run test --workspace @blitz/web -- src/app/router.test.tsx
```

Observed failure:

```text
Cannot find module './router' imported from apps/web/src/app/router.test.tsx
```

That failure was intentional and confirmed the router test was failing for the right reason before
the React Router implementation was added.

## GREEN

After adding `apps/web/src/app/router.tsx`, `apps/web/src/app/App.tsx`, `apps/web/src/main.tsx`,
the page components, and the retro shell styling:

```bash
npm run test --workspace @blitz/web -- src/app/router.test.tsx
npm run lint --workspace @blitz/web
npm run build --workspace @blitz/web
```

All three commands completed successfully in the local workspace.

## Party Arcade Refresh

On 2026-04-25 the router was refreshed again for the party arcade architecture:

- `/` stayed legacy
- `/hub` became mode-first
- `/practice` and `/race/bot` were retired as primary product routes and redirected to `/hub/single`
- multiplayer session routes moved under the neutral lobby/results flow

That refresh was verified by the updated `apps/web/src/app/router.test.tsx` suite.
