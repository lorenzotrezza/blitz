export type DragShiftQuality = 'early' | 'good' | 'perfect' | 'late';

interface ShiftQualityBadgeProps {
  quality: DragShiftQuality | null;
}

const QUALITY_LABELS: Record<DragShiftQuality, string> = {
  early: 'EARLY',
  good: 'GOOD',
  perfect: 'PERFECT',
  late: 'LATE',
};

export function ShiftQualityBadge({ quality }: ShiftQualityBadgeProps) {
  return (
    <span
      className={[
        'shift-quality-badge',
        quality ? `is-${quality}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {quality ? QUALITY_LABELS[quality] : '--'}
    </span>
  );
}
