import express from 'express';
import path from 'path';

export function setupDownloadRoutes(app: express.Express) {
  app.use('/downloads', express.static(path.join(process.cwd(), 'public')));
}