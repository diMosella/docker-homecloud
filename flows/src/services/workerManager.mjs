'use strict';

import cluster from 'cluster';
import messenger from '../basics/messenger.mjs';
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
    exec
  });
  return cluster.fork();
};

export default class {
  #_workers = []; // eslint-disable-line
  #_processing;

  constructor (processing) {
    if (typeof processing !== 'object' || typeof processing.start !== 'function' || typeof processing.stop !== 'function') {
      throw new TypeError('processing should be an object with start and stop functions');
    }
    this.#_processing = processing;
  }

  /**
   * MessageHandler
   * @param { Number } processId The process id to create a message handler for
   * @returns { Promise } The handler as a promise
   */
  #_createMessageBus = (processId) => async (message) => {
    // TODO: remove logging
    console.log(`${new Date().toISOString()}: Worker ${processId} delivered a message ('${ACTION.getProperty(message.action, 'label')}')`);
    let foundCandidate;

    switch (message.action) {
      case ACTION.AVAILABLE:
        if (this.#_processing.isProcessing() === true && this.getTypeOf(processId) === WORKER_TYPE.CONVERTER) {
          this.assignTask(processId);
        }
        break;
      case ACTION.PING:
        foundCandidate = this.#_workers.find((candidate) => candidate.id === processId);
        if (foundCandidate) {
          foundCandidate.worker.send({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
        }
        break;
      case ACTION.QUEUE_PROCESS:
        this.#_processing.start();
        break;
      case ACTION.QUEUE_LOCK:
        foundCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
        if (foundCandidate) {
          foundCandidate.worker.send(message);
        }
        console.log('lock', message.payload);
        break;
      case ACTION.QUEUE_FINISH:
        foundCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
        if (foundCandidate) {
          foundCandidate.worker.send(message);
        }
        console.log('finish', message.payload);
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

  assignTask = async (processId) => {
    const foundSoloCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
    const foundConverterCandidate = this.#_workers.find((candidate) => candidate.id === processId && candidate.type === WORKER_TYPE.CONVERTER);
    if (!foundSoloCandidate || !foundConverterCandidate) {
      return false;
    }
    const task = await messenger({ action: ACTION.QUEUE_GET }, foundSoloCandidate.worker).catch((err) => console.log('no-task', err));
    if (task && task.action === ACTION.QUEUE_GOT && task.payload !== null) {
      foundConverterCandidate.worker.send(task);
    }
  }
}
