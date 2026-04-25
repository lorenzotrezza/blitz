---
quick_id: 20260425
slug: ui-laps-gift-locked-maps
status: complete
completed: 2026-04-25
---

# Summary

Completed the legacy Blitz UI quick task.

## Changes
- Car selection now shows an explicit `REGALO: N GIRI` badge plus a short track-day reality note explaining why that car gets that lap count.
- The final result screen now has a clear `REGALO UFFICIALE` gift card describing the real track voucher for the selected car.
- Every locked track card is clickable and opens a dumb locked-track modal with track-specific copy; the existing Roman circuit modal remains separate.
- Synced `apps/web/public/legacy/index.html` with the root `index.html` legacy source.
- Added legacy tests for gifted lap copy, final gift clarity, and locked-track clickability.

## Verification
- `node --test tests/blitz-flow.test.js` passed.
- `pnpm --filter @blitz/web test` passed.
- `pnpm --filter @blitz/web build` passed.
