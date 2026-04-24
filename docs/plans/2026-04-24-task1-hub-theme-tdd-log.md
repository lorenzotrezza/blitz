# Task 1 Hub Theme TDD Log

## RED

Before the 10bit hub implementation, the `/hub` router test was expanded to assert the stronger
copy and route-entry contract:

```bash
npm run test --workspace @blitz/web -- src/app/router.test.tsx
```

Observed failure:

```text
missing heading /hub minigiochi/i
```

The failure was expected because `/hub` still rendered the generic shell language:

- `Railway Build`
- `Blitz Race Control`
- `Game Hub`

That verified the test was failing for the correct Task 1 reason before the hub copy/theme update.

## GREEN

After updating:

- `apps/web/index.html`
- `apps/web/src/app/router.tsx`
- `apps/web/src/pages/HubPage.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/app/router.test.tsx`

the following checks passed:

```bash
npm run test --workspace @blitz/web -- src/app/router.test.tsx
npm run lint --workspace @blitz/web
npm run build --workspace @blitz/web
```
