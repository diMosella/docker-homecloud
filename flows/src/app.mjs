import { cpus } from 'os';
import cluster from 'cluster';
import path from 'path';
import { notify, ACTION } from './trigger.mjs';
import { read } from './exif.mjs';
import Queue from './queue.mjs';
import sleeper, { TIME_UNIT } from './sleeper.mjs';

import serve from 'koa-static';
import Router from '@koa/router';
import Koa from 'koa';

if(cluster.isMaster) {
  console.log(`${new Date().toISOString()}: Master ${process.pid} is running`);

  const notifyer = (msg) => {
    switch (msg.action) {
      case ACTION.START:
        for (const id in cluster.workers) {
          cluster.workers[id].send({ action: ACTION.START, payload: queue.next() });
        };
        break;
      default: break;
    }
  };

  const queue = new Queue(notifyer);

  const messageHandler = (id) => async (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${id} delivered a message ('${ACTION.properties[msg.action].label}')`);
    switch (msg.action) {
      case ACTION.ADD:
        queue.push(msg.payload);
        break;
      case ACTION.LOCK:
        queue.lock(msg.payload.qid);
        break;
      case ACTION.FINISH:
        cluster.workers[msg.payload.wid].send({ action: ACTION.START, payload: queue.next() });
        break;
      default:
        break;
    }
  };

  const numWorkers = cpus().length;

  console.log(`${new Date().toISOString()}: Master cluster setting up ${numWorkers} workers...`);

  for(var i = 0; i < numWorkers; i++) {
      cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler(cluster.workers[id].process.pid));
  }

  cluster.on('online', (worker) => {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
    console.log(`${new Date().toISOString()}: Starting a new worker`);
    cluster.fork();
  });

} else if (cluster.isWorker) {
  const processItem = async (item) => {
    await sleeper(10, TIME_UNIT.SECOND).sleep;
    process.send({ action: ACTION.FINISH, payload: { qid: item.qid, wid: cluster.worker.id } });
  };

  process.on('message', (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
    switch (msg.action) {
      case ACTION.START:
        const { value, done } = msg.payload;
        if (value) {
          console.log(`${new Date().toISOString()}: Worker ${process.pid} locking qid: ${value.qid}`);
          process.send({ action: ACTION.LOCK, payload: { qid: value.qid } });
          processItem(value);
        }
        break;
      default: break;
    }
  });
  const app = new Koa();
  const triggerRouter = new Router();
  const port = 8000;
  const __dirname = path.resolve();
  const docroot = path.join(__dirname, '../');

  triggerRouter.get('/trigger', notify);
  triggerRouter.use(read);

  app.context.flow = {
    fileInfo: null
  };

  // logger
  app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${new Date().toISOString()}: ${ctx.method} ${ctx.url} - ${rt}`);
    console.log(`${new Date().toISOString()}: from worker ${cluster.worker.process.pid}`);
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
}
