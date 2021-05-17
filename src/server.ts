import http from 'http';
import express from 'express';
import middleware from './middleware';
import errorHandlers from './middleware/errorHandlers';
import { applyMiddleware, applyRoutes } from './utils';
import { getRoutes } from './services';

process.on('uncaughtException', (e) => {
  console.log(e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  console.log(e);
  process.exit(1);
});

export const createApp = async () => {
  const router = express();
  router.use(express.json({ limit: '50mb' }));

  const routes = await getRoutes();
  applyMiddleware(middleware, router);
  applyRoutes(routes, router);
  applyMiddleware(errorHandlers, router);

  return router;
};

const { PORT = 3100 } = process.env;

createApp().then((router) => {
  http.createServer(router).listen(PORT, () => {
    console.log(`Production server on Port:${PORT}...`);
  });
});
