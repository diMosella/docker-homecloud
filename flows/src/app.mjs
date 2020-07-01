'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import sleeper from './basics/sleeper.mjs';
import WorkerManager from './services/workerManager.mjs';
import { RETRY_MAX_COUNT, TIME_UNIT, WORKER_TYPE } from './basics/constants.mjs';

if (!cluster.isMaster) {
  throw new Error('This app should be run as non-worker process');
}

console.log(`${new Date().toISOString()}: Delegator ${process.pid} is running`);

const cpuCount = cpus().length;
const retries = Object.values(WORKER_TYPE).reduce((acumm, type) => Object.assign(acumm, { [type]: 0 }), {});
let isProcessing = false;

const processing = {
  start: () => {
    if (isProcessing !== false) {
      return;
    }
    console.log('start processing');
    for (let i = 0; i < cpuCount; i++) {
      workerManager.add(WORKER_TYPE.CONVERTER);
    }
    isProcessing = true;
  },
  stop: () => {
    if (isProcessing !== true) {
      return;
    }
    console.log('stop processing');
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
  isProcessing: () => isProcessing,
  resetRetry: async (type) => {
    if (!(type in Object.values(WORKER_TYPE))) {
      throw new TypeError('type should be in WorkerTypeEnum');
    }
    await sleeper(10, TIME_UNIT.SECONDS).sleep;
    retries[type] = 0;
  }
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

  if (retries[type] < RETRY_MAX_COUNT) {
    workerManager.add(type);
    retries[type]++;
  }
});
