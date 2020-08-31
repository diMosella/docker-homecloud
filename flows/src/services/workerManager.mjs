'use strict';

import cluster from 'cluster';
import messenger from '../basics/messenger.mjs';
import Log from './log.mjs';
import Sequencer from './sequencer.mjs';
import { ACTION, TIME_UNIT, WORKER_TYPE } from '../basics/constants.mjs';

if (!cluster.isMaster) {
  throw new Error('This workerManager should be run as non-worker process');
}

const log = new Log();

const createWorker = (type) => {
  const exec = WORKER_TYPE.getProperty(type, 'code');
  log.info(`starting a new ${WORKER_TYPE.getProperty(type, 'label')}`);
  cluster.setupMaster({
    exec
  });
  return cluster.fork();
};

export default class {
  #_workers = []; // eslint-disable-line
  #_processes;
  #_isProcessing = false;
  #_sequencer = new Sequencer();

  constructor (processes) {
    if (typeof processes !== 'object' || typeof processes.addConverters !== 'function' || typeof processes.removeConverters !== 'function') {
      throw new TypeError('processes should be an object with addConverters and removeConverters functions');
    }
    this.#_processes = processes;
  }

  /**
   * MessageHandler
   * @param { Number } processId The process id to create a message handler for
   * @returns { Promise } The handler as a promise
   */
  #_createMessageBus = (processId) => async (message) => {
    log.debug(`Worker ${processId} delivered a message ('${ACTION.getProperty(message.action, 'label')}')`);
    let foundCandidate;

    const { action, payload } = message;

    switch (action) {
      case ACTION.AVAILABLE:
        const type = this.getTypeOf(processId);
        if (this.#_isProcessing === true && type === WORKER_TYPE.CONVERTER) {
          this.assignTask(processId);
        }
        this.#_processes.resetRetry(type);
        break;
      case ACTION.PING:
        foundCandidate = this.#_workers.find((candidate) => candidate.id === processId);
        if (foundCandidate) {
          foundCandidate.worker.send({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
        }
        break;
      case ACTION.QUEUE_PROCESS:
        if (this.#_isProcessing === true) {
          break;
        }
        this.#_processes.addConverters();
        this.#_isProcessing = true;
        break;
      case ACTION.QUEUE_LOCK:
        foundCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
        if (foundCandidate) {
          foundCandidate.worker.send({ action, payload });
        }
        break;
      case ACTION.QUEUE_FINISH:
        foundCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
        if (foundCandidate) {
          foundCandidate.worker.send({ action, payload });
        }
        break;
      case ACTION.QUEUE_FINAL:
        if (this.#_isProcessing === false) {
          break;
        }
        this.#_processes.removeConverters();
        this.#_isProcessing = false;
        break;
      case ACTION.CACHE_GET:
      case ACTION.CACHE_LISTEN:
        foundCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
        if (foundCandidate) {
          const response = await messenger({ action, payload}, foundCandidate.worker, 5, TIME_UNIT.SECOND)
            .catch((error) => {
              log.warn('no return message from cache while listening', error);
              return Promise.resolve(error);
            });
          if (response && !(response instanceof Error)) {
            const { action, payload } = response;
            foundCandidate = this.#_workers.find((candidate) => candidate.id === processId);
            foundCandidate.worker.send({ action, payload });
          }
        }
        break;
      case ACTION.CACHE_SET:
        foundCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
        if (foundCandidate) {
          foundCandidate.worker.send({ action, payload });
        }
        break;
      default:
        break;
    }
  };

  add (type) {
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

  remove (processId) {
    const candidateIndex = this.#_workers.findIndex((candidate) => candidate.id === processId);
    if (candidateIndex !== -1) {
      const removedCandidate = this.#_workers.splice(candidateIndex, 1)[0];
      removedCandidate.worker.removeListener('message', removedCandidate.messageBus);
      removedCandidate.worker.kill();
    }
  };

  getTypeOf (processId) {
    const foundCandidate = this.#_workers.find((candidate) => candidate.id === processId);
    if (foundCandidate) {
      return foundCandidate.type;
    }
    return null;
  };

  async assignTask (processId) {
    const foundSoloCandidate = this.#_workers.find((candidate) => candidate.type === WORKER_TYPE.SOLO);
    const foundConverterCandidate = this.#_workers.find((candidate) => candidate.id === processId && candidate.type === WORKER_TYPE.CONVERTER);
    if (!foundSoloCandidate || !foundConverterCandidate) {
      return false;
    }
    await this.#_sequencer.start();
    const task = await messenger({ action: ACTION.QUEUE_GET }, foundSoloCandidate.worker)
      .catch((error) => log.warn('no return message from queue', error));
    this.#_sequencer.done();
    if (task && task.action === ACTION.QUEUE_GOT && task.payload !== null) {
      foundConverterCandidate.worker.send(task);
    }
  };
}
