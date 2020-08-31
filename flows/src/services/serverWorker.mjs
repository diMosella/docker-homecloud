'use strict';

import path from 'path';
import Koa from 'koa';
import Router from '@koa/router';
import json from 'koa-json';
import send from 'koa-send';
import Log from './log.mjs';
import { notify } from '../tasks/trigger.mjs';
import messenger from '../basics/messenger.mjs';
import { ACTION, ENVIRONMENT } from '../basics/constants.mjs';

const isProd = process.env.NODE_ENV === ENVIRONMENT.getProperty(ENVIRONMENT.PRODUCTION, 'label');

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

  const log = new Log();

  const app = new Koa();
  const staticRoute = async (ctx) => {
    await send(ctx, ctx.path, { root: docroot });
  };
  const triggerRouter = new Router();
  const healthRouter = new Router();
  const port = 8000;
  // FIXME: test if this works in Docker
  const host = isProd ? '::' : 'localhost';
  const __dirname = path.resolve();
  const docroot = path.join(__dirname, `./${isProd ? 'dist' : 'src'}/public`);

  triggerRouter.get('/trigger', notify);
  triggerRouter.use(json());
  // triggerRouter.use(read);

  healthRouter.get('/status', async (ctx, _next) => {
    const startTimestamp = Date.now();
    const message = await messenger({ action: ACTION.PING, payload: { processId } })
      .catch((error) => log.warn('no return message for ping', error));

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
    log.debug(`${ctx.method} ${ctx.url} - ${rt}, by worker ${processId}`);
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
  app.use(staticRoute);

  return app.listen({ port, host }, () => {
    log.info(`Worker server ${processId} at ${Date.now()} - listening on ${host}:${port}.`);
    outbox({ action: ACTION.AVAILABLE });
  });
};

export default {
  start
};
