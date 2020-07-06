'use strict';

import { ACTION, QUEUE_DELAY, STATE, TIME_UNIT } from '../basics/constants.mjs';
import sleeper from '../basics/sleeper.mjs';

export default class Queue {
  #_queue = [];
  #_interrupts = [];
  #_generator;
  #_idGenerator;
  #_isInterrupting = false;
  #_isProcessing = false;
  #_broadcast;
  #_waitTime;

  /**
   * Create a Queue
   * @param { function } broadcast The method to broadcast actions
   */
  constructor (broadcast, waitTime = QUEUE_DELAY) {
    this.#_broadcast = broadcast;
    this.#_waitTime = waitTime;
    this.#_idGenerator = this.#_idGeneratorFunction();
    this.#_generator = this.#_generatorFunction();
  }

  #_interruptAll = () => {
    if (this.#_isInterrupting) {
      return;
    }
    this.#_isInterrupting = true;
    for (const interrupt of this.#_interrupts) {
      interrupt();
    }
    this.#_interrupts.length = 0;
    this.#_isInterrupting = false;
  };

  #_generatorFunction = function* () {
    let index;
    for (let retryCounter = 0; retryCounter < 2; retryCounter++) {
      index = 0;
      for (index in this.#_queue) {
        if (this.#_queue[index].state === STATE.QUEUED) {
          yield this.#_queue[index++];
        }
      }
    }
  };

  #_idGeneratorFunction = function* () {
    let index = 0;
    while (true) {
      yield index++;
    }
  }

  /**
   * Add an item to the queue, and when no new items arrive, start the processing
   * @param { Object } itemPayload
   */
  async push (itemPayload) {
    if (!itemPayload || this.#_isProcessing === true) {
      return;
    }
    this.#_queue.push(Object.assign({}, itemPayload, { queueId: this.#_idGenerator.next().value, state: STATE.QUEUED }));
    const queueSize = this.#_queue.length;
    this.#_interruptAll();

    const { sleep, interrupt } = sleeper(this.#_waitTime, TIME_UNIT.SECOND);
    this.#_interrupts.push(interrupt);
    let isError = false;
    await sleep.catch((_err) => {
      isError = true;
    });
    if (isError) {
      return;
    }

    if (this.#_queue.length === queueSize) {
      this.#_generator = this.#_generatorFunction();
      this.#_broadcast(ACTION.QUEUE_PROCESS);
      this.#_isProcessing = true;
    }
  };

  /**
   * Get the next item to be processed
   * @param value Not yet implemented
   */
  next (value) {
    return this.#_generator !== null
      ? this.#_generator.next(value)
      : { done: true };
  };

  /**
   * Mark a queue item as locked, being processed
   * @param { Number } id The id of the item to be locked
   */
  lock (id) {
    if (typeof id !== 'number') {
      throw new TypeError('id should be a number');
    }
    const itemId = this.#_queue.findIndex((item) => item.queueId === id);
    if (itemId !== -1 && this.#_queue[itemId].state < STATE.LOCKED) {
      this.#_queue[itemId].state = STATE.LOCKED;
    }
  };

  get isProcessing () {
    return this.#_isProcessing;
  }

  /**
   * Mark a queue item for which processing has been finished, as processed
   * @param { Number } id The id of the item for which the processing has been finished
   */
  finish (id) {
    if (typeof id !== 'number') {
      throw new TypeError('id should be a number');
    }
    const itemId = this.#_queue.findIndex((item) => item.queueId === id);
    if (itemId !== -1 && this.#_queue[itemId].state < STATE.PROCESSED) {
      this.#_queue[itemId].state = STATE.PROCESSED;
    }
    const notFinished = this.#_queue.filter((item) => item.state !== STATE.PROCESSED);
    if (notFinished.length === 0) {
      this.#_broadcast(ACTION.QUEUE_FINAL);
      this.#_isProcessing = false;
    }
  };

  /**
   * Reset the queue
   */
  reset () {
    this.#_queue.length = 0;
    this.#_generator = null;
  }
}
