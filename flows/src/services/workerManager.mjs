'use strict';

import cluster from 'cluster';
import { ACTION, WORKER_TYPE } from '../basics/constants.mjs';

if (!cluster.isMaster) {
  throw new Error('This workerManager should be run as non-worker process');
}

const createWorker = (type) => {
  if (!(type in Object.values(WORKER_TYPE))) {
    throw new TypeError('type should be in WorkerTypeEnum');
  }
  const exec = WORKER_TYPE.getProperty(type, 'code');
  console.log(`${new Date().toISOString()}: Starting a new ${WORKER_TYPE.getProperty(type, 'label')}`);
  cluster.setupMaster({
    exec,
    args: ['--start']
  });
  return cluster.fork();
};

export default class {
  #_workers = []; // eslint-disable-line

  /**
   * MessageHandler
   * @param { Number } processId The process id to create a message handler for
   * @returns { Promise } The handler as a promise
   */
  #_createMessageBus = (processId) => async (message) => {
    // TODO: remove logging
    console.log(`${new Date().toISOString()}: Worker ${processId} delivered a message ('${ACTION.getProperty(message.action, 'label')}')`);

    switch (message.action) {
      case ACTION.PING:
        const foundCandidate = this.#_workers.find((candidate) => candidate.id === processId);
        if (foundCandidate) {
          foundCandidate.worker.send({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
        }
        break;
      default:
        break;
    }
  };

  add = (type) => {
    if (!(type in Object.values(WORKER_TYPE))) {
      throw new TypeError('type should be in WorkerTypeEnum');
    }
    if (type === WORKER_TYPE.SOLO) {
      const candidateIndex = this.#_workers.findIndex((candidate) => candidate.type === WORKER_TYPE.SOLO);
      if (candidateIndex !== -1) {
        throw new Error('only one SOLO worker is allowed to be active');
      }
    }
    const worker = createWorker(type);
    const messageBus = this.#_createMessageBus(worker.process.pid);
    worker.on('message', messageBus);
    this.#_workers.push({ type, id: worker.process.pid, worker, messageBus });
  };

  remove = (processId) => {
    const candidateIndex = this.#_workers.findIndex((candidate) => candidate.id === processId);
    if (candidateIndex !== -1) {
      const removedCandidate = this.#_workers.splice(candidateIndex, 1)[0];
      removedCandidate.worker.removeListener('message', removedCandidate.messageBus);
    }
  };

  getTypeOf = (processId) => {
    const foundCandidate = this.#_workers.find((candidate) => candidate.id === processId);
    if (foundCandidate) {
      return foundCandidate.type;
    }
    return null;
  };
}
