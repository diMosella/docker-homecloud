import { cpus } from 'os';
import cluster from 'cluster';
import path from 'path';
import sleep, { TIME_UNIT } from './sleep.mjs';
import { notify, ACTION, STATE } from './trigger.mjs';
import { read } from './exif.mjs';

import serve from 'koa-static';
import Router from '@koa/router';
import Koa from 'koa';

const __dirname = path.resolve();
const queue = [];

const generatefromQueue = function* () {
  yield queue[0];
};

const generator = generatefromQueue();

const messageHandler = (id) => async (msg) => {
  console.log(`${new Date().toISOString()}: Worker ${id} delivered a message ('${ACTION.properties[msg.action].label}')`);
  queue.push(msg.payload);
  const prevQueueSize = queue.length;
  await sleep(30, TIME_UNIT.SECOND);
  if (queue.length === prevQueueSize) {
    console.log(`${new Date().toISOString()}: start processing queue`);
    for (const id in cluster.workers) {
      cluster.workers[id].send({ action: ACTION.START });
    }
  }
};

if(cluster.isMaster) {
  console.log(`${new Date().toISOString()}: Master ${process.pid} is running`);
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
  process.on('message', (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
    queue.find(item => item.state === STATE.QUEUED)
  });
  const app = new Koa();
  const triggerRouter = new Router();
  const port = 8000;
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
