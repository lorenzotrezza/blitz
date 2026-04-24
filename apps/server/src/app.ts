import express, { type Express } from 'express';

import { registerHealthRoute } from './http/health.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');

  registerHealthRoute(app);

  return app;
}
