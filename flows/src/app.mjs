'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import httpWorker from './services/worker.mjs';
import { ACTION } from './tasks/trigger.mjs';
import Queue from './services/queue.mjs';
import sleeper, { TIME_UNIT } from './basics/sleeper.mjs';

if(cluster.isMaster) {
  console.log(`${new Date().toISOString()}: Master ${process.pid} is running`);

  const notify = (msg) => {
    switch (msg.action) {
      case ACTION.START:
        for (const id in cluster.workers) {
          cluster.workers[id].send({ action: ACTION.START, payload: queue.next() });
        };
        break;
      default: break;
    }
  };

  const queue = new Queue(notify);

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

  const numberOfWorkers = cpus().length;

  console.log(`${new Date().toISOString()}: Master cluster setting up ${numberOfWorkers} workers...`);

  for(var i = 0; i < numberOfWorkers; i++) {
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
  httpWorker(process.pid);
}
