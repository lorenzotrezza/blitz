import type { Express, RequestHandler } from 'express';

const healthHandler: RequestHandler = (_request, response) => {
  response.status(200).json({ status: 'ok' });
};

export function registerHealthRoute(app: Express): void {
  app.get('/health', healthHandler);
}
