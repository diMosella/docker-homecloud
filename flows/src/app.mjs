'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import { WORKER_TYPE } from './basics/constants.mjs';
import WorkerManager from './services/workerManager.mjs';

if (!cluster.isMaster) {
  throw new Error('This app should be run as non-worker process');
}

console.log(`${new Date().toISOString()}: Delegator ${process.pid} is running`);

const cpuCount = cpus().length;
let isProcessing = false;

const processing = {
  start: () => {
    if (isProcessing !== false) {
      return;
    }
    for (let i = 0; i < cpuCount; i++) {
      workerManager.add(WORKER_TYPE.CONVERTER);
    }
    isProcessing = true;
  },
  stop: () => {
    if (isProcessing !== true) {
      return;
    }
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      const processId = worker.process.pid;
      if (workerManager.getTypeOf(processId) === WORKER_TYPE.CONVERTER) {
        worker.kill();
        workerManager.remove(processId);
      }
    }
    isProcessing = false;
  },
  isProcessing: () => isProcessing
};

const workerManager = new WorkerManager(processing);

workerManager.add(WORKER_TYPE.SOLO);
workerManager.add(WORKER_TYPE.SERVER);

cluster.on('online', (worker) => {
  console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} is online`);
});

cluster.on('exit', (worker, code, signal) => {
  let isCausedByError = false;
  if (signal) {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} was killed by signal: ${signal}`);
  } else if (code !== 0) {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} exited with error: ${code}`);
    isCausedByError = true;
  } else {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} finished`);
  }
  const type = workerManager.getTypeOf(worker.process.pid);
  workerManager.remove(worker.process.pid);

  if (!isCausedByError) {
    return;
  }

  workerManager.add(type);
});
