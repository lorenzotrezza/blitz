import { type CSSProperties } from 'react';

export interface DragShiftWindow {
  goodMinRpm: number;
  perfectMinRpm: number;
  perfectMaxRpm: number;
  goodMaxRpm: number;
  redlineRpm: number;
}

interface RpmShiftMeterProps {
  rpm: number;
  window: DragShiftWindow;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function percentOfRedline(value: number, redlineRpm: number) {
  if (!Number.isFinite(value) || !Number.isFinite(redlineRpm) || redlineRpm <= 0) {
    return 0;
  }

  return clampPercent((value / redlineRpm) * 100);
}

export function RpmShiftMeter({ rpm, window }: RpmShiftMeterProps) {
  const redlineRpm = Math.max(1, window.redlineRpm);
  const windowStart = percentOfRedline(window.goodMinRpm, redlineRpm);
  const windowEnd = percentOfRedline(window.goodMaxRpm, redlineRpm);
  const perfectStart = percentOfRedline(window.perfectMinRpm, redlineRpm);
  const perfectEnd = percentOfRedline(window.perfectMaxRpm, redlineRpm);
  const currentRpm = Math.max(0, Math.round(rpm));

  const meterStyle = {
    '--drag-window-start': `${Math.min(windowStart, windowEnd)}%`,
    '--drag-window-width': `${Math.max(4, Math.abs(windowEnd - windowStart))}%`,
    '--drag-perfect-start': `${Math.min(perfectStart, perfectEnd)}%`,
    '--drag-perfect-width': `${Math.max(2, Math.abs(perfectEnd - perfectStart))}%`,
    '--drag-needle-left': `${percentOfRedline(currentRpm, redlineRpm)}%`,
  } as CSSProperties;

  return (
    <div className="drag-rpm-meter" style={meterStyle}>
      <div className="drag-rpm-meter__readout">
        <span>RPM</span>
        <strong>{currentRpm}</strong>
      </div>
      <div className="drag-rpm-meter__rail" aria-hidden="true">
        <span className="drag-rpm-meter__window" />
        <span className="drag-rpm-meter__perfect" />
        <span className="drag-rpm-meter__needle" />
      </div>
    </div>
  );
}
