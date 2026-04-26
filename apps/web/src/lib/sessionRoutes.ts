import type { SessionStartedPayload } from '@blitz/shared';

export function resolveSessionRoute(payload: SessionStartedPayload): string {
  if (payload.game === 'lights') {
    return `/session/lights/${payload.sessionId}`;
  }

  if (payload.game === 'penalty') {
    return `/session/penalty/${payload.sessionId}`;
  }

  if (payload.game === 'race' && payload.variant === 'drag-sprint') {
    return `/race/drag/${payload.sessionId}`;
  }

  return `/race/live/${payload.sessionId}`;
}
