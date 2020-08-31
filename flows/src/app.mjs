'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import sleeper from './basics/sleeper.mjs';
import Log from './services/log.mjs';
import WorkerManager from './services/workerManager.mjs';
import {
  ENVIRONMENT, RETRY_DELAY, RETRY_MAX_COUNT,
  TIME_UNIT, WORKER_TYPE
} from './basics/constants.mjs';

const start = () => {
  if (!cluster.isMaster) {
    return Promise.reject(new TypeError('This app should be run as non-worker process'));
  }

  const log = new Log();

  log.debug(`Delegator ${process.pid} is running`);

  const cpuCount = cpus().length;
  const retries = Object.values(WORKER_TYPE)
    .reduce((acumm, type) => Object.assign(acumm, { [type]: 0 }), {});

  const processes = {
    addConverters: () => {
      for (let i = 0; i < cpuCount; i++) {
        workerManager.add(WORKER_TYPE.CONVERTER);
      }
    },
    removeConverters: () => {
      for (const id in cluster.workers) {
        const worker = cluster.workers[id];
        const processId = worker.process.pid;
        if (workerManager.getTypeOf(processId) === WORKER_TYPE.CONVERTER) {
          workerManager.remove(processId);
        }
      }
    },
    resetRetry: async (type) => {
      if (!(type in Object.values(WORKER_TYPE))) {
        return Promise.reject(new TypeError('type should be in WorkerTypeEnum'));
      }
      await sleeper(RETRY_DELAY, TIME_UNIT.SECONDS).sleep;
      retries[type] = 0;
    }
  };

  const workerManager = new WorkerManager(processes);

  workerManager.add(WORKER_TYPE.SOLO);
  workerManager.add(WORKER_TYPE.SERVER);

  cluster.on('online', (worker) => {
    log.info(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    let isCausedByError = false;
    if (signal) {
      log.info(`Worker ${worker.process.pid} was killed by signal: ${signal}`);
    } else if (code !== 0) {
      log.info(`Worker ${worker.process.pid} exited with error: ${code}`);
      isCausedByError = true;
    } else {
      log.info(`Worker ${worker.process.pid} finished`);
    }
    const type = workerManager.getTypeOf(worker.process.pid);
    workerManager.remove(worker.process.pid);

    if (!isCausedByError) {
      return;
    }

    if (retries[type]++ < RETRY_MAX_COUNT) {
      workerManager.add(type);
    }
  });
};

export default {
  start
};

if (process.env.NODE_ENV !== ENVIRONMENT.getProperty(ENVIRONMENT.TEST, 'label')) {
  start();
}
