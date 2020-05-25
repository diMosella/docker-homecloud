'use strict';

import path from 'path';
import Koa from 'koa';
import Router from '@koa/router';
import json from 'koa-json';
import serve from 'koa-static';
import { notify } from '../tasks/trigger.mjs';
import { read } from '../tasks/exif.mjs';

export default (pid) => {
  const app = new Koa();
  const triggerRouter = new Router();
  const port = 8000;
  const __dirname = path.resolve();
  const docroot = path.join(__dirname, '../');

  triggerRouter.get('/trigger', notify);
  triggerRouter.use(json());
  triggerRouter.use(read);

  app.context.flow = {
    fileInfo: null
  };

  // logger
  app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${new Date().toISOString()}: ${ctx.method} ${ctx.url} - ${rt}`);
    console.log(`${new Date().toISOString()}: from worker ${pid}`);
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
  app.use(serve(docroot));

  app.listen(port, () => {
    console.log(`${new Date().toISOString()}: Flows listening on port ${port}.`);
  });
};
