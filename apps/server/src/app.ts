import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import express, { type Express } from 'express';

import { registerHealthRoute } from './http/health.js';

const defaultWebDistPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../web/dist');
const spaFallbackPattern = /^\/(?!socket\.io(?:\/|$)).*/;

export interface CreateAppOptions {
  webDistPath?: string;
}

function registerWebApp(app: Express, webDistPath: string): void {
  if (!existsSync(webDistPath)) {
    return;
  }

  app.use(express.static(webDistPath));
  app.get(spaFallbackPattern, (_request, response) => {
    response.sendFile(resolve(webDistPath, 'index.html'));
  });
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  app.disable('x-powered-by');

  registerHealthRoute(app);
  registerWebApp(app, options.webDistPath ?? defaultWebDistPath);

  return app;
}
