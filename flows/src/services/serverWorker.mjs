'use strict';

import path from 'path';
import Koa from 'koa';
import Router from '@koa/router';
import json from 'koa-json';
import serve from 'koa-static';
import { notify } from '../tasks/trigger.mjs';
import messenger from '../basics/messenger.mjs';
import { ACTION } from '../basics/constants.mjs';

const outbox = (message) => {
  process.send(message);
};

const inbox = (message) => {
  switch (message.action) {
    case ACTION.PING:
      outbox({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
      break;
    default:
      break;
  }
};

const start = () => {
  const processId = process.pid;

  process.on('message', inbox);

  const app = new Koa();
  const triggerRouter = new Router();
  const healthRouter = new Router();
  const port = 8000;
  // const host = '192.168.50.219';
  const host = 'localhost';
  const __dirname = path.resolve();
  const docroot = path.join(__dirname, './src/public');

  triggerRouter.get('/trigger', notify);
  triggerRouter.use(json());
  // triggerRouter.use(read);

  healthRouter.get('/status', async (ctx, _next) => {
    const startTimestamp = Date.now();
    const message = await messenger({ action: ACTION.PING, payload: { processId } }).catch((err) => console.log('no-message', err));

    if (message && message.action === ACTION.PONG) {
      ctx.body = { success: !(message.payload.healthTimestamp - startTimestamp < 0) };
    } else {
      ctx.body = { success: false };
    }
  });
  healthRouter.use(json());

  app.context.flow = {
    fileInfo: null
  };

  // logger
  app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${new Date().toISOString()}: ${ctx.method} ${ctx.url} - ${rt}, by worker ${processId}`);
  });

  // x-response-time
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
  });

  // response
  app.use(triggerRouter.routes());
  app.use(healthRouter.routes());
  app.use(serve(docroot));

  return app.listen({ port, host }, () => {
    console.log(`${new Date().toISOString()}: Flows listening on ${host}:${port}.`);
    outbox({ action: ACTION.AVAILABLE });
  });
};

export default {
  start
};
