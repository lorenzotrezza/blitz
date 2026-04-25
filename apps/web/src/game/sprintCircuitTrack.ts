export interface TrackPoint {
  x: number;
  y: number;
}

export const SPRINT_CIRCUIT_SIZE = {
  width: 420,
  height: 560,
} as const;

export const SPRINT_CIRCUIT_CENTERLINE: TrackPoint[] = [
  { x: 112, y: 88 },
  { x: 286, y: 88 },
  { x: 332, y: 136 },
  { x: 332, y: 230 },
  { x: 286, y: 276 },
  { x: 194, y: 276 },
  { x: 146, y: 328 },
  { x: 146, y: 438 },
  { x: 204, y: 484 },
  { x: 304, y: 484 },
  { x: 336, y: 430 },
  { x: 336, y: 340 },
  { x: 248, y: 316 },
  { x: 154, y: 256 },
  { x: 94, y: 168 },
];

export const SPRINT_CIRCUIT_CHECKPOINTS = [
  { x: 216, y: 88 },
  { x: 332, y: 182 },
  { x: 240, y: 276 },
  { x: 146, y: 384 },
  { x: 256, y: 484 },
  { x: 290, y: 326 },
] as const;

export function drawSprintCircuitTrack(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, SPRINT_CIRCUIT_SIZE.width, SPRINT_CIRCUIT_SIZE.height);
  context.fillStyle = '#06060d';
  context.fillRect(0, 0, SPRINT_CIRCUIT_SIZE.width, SPRINT_CIRCUIT_SIZE.height);

  context.fillStyle = '#0d2c14';
  context.fillRect(24, 24, SPRINT_CIRCUIT_SIZE.width - 48, SPRINT_CIRCUIT_SIZE.height - 48);

  context.strokeStyle = '#c8d4df';
  context.lineWidth = 54;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.beginPath();
  SPRINT_CIRCUIT_CENTERLINE.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
      return;
    }

    context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.stroke();

  context.strokeStyle = '#232836';
  context.lineWidth = 34;
  context.beginPath();
  SPRINT_CIRCUIT_CENTERLINE.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
      return;
    }

    context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.stroke();

  context.setLineDash([12, 16]);
  context.strokeStyle = '#ffffff';
  context.lineWidth = 4;
  context.beginPath();
  SPRINT_CIRCUIT_CENTERLINE.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
      return;
    }

    context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#00aadd';
  SPRINT_CIRCUIT_CHECKPOINTS.forEach((point, index) => {
    context.fillRect(point.x - 5, point.y - 5, 10, 10);
    context.fillStyle = '#ddeeff';
    context.font = '7px "Press Start 2P", monospace';
    context.fillText(String(index + 1), point.x + 8, point.y - 8);
    context.fillStyle = '#00aadd';
  });

  context.strokeStyle = '#ff3333';
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(96, 78);
  context.lineTo(128, 102);
  context.stroke();
}
