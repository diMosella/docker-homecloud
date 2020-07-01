'use strict';

import { ACTION, STATE, TIME_UNIT } from '../basics/constants.mjs';
import sleeper from '../basics/sleeper.mjs';

const TIMEOUT = 10;

export default class Queue {
  #_queue = [];
  #_interrupts = [];
  #_generator;
  #_idGenerator;
  #_isInterrupting = false;
  #_broadcast;
  #_waitTime;

  /**
   * Create a Queue
   * @param { function } broadcast The method to broadcast actions
   */
  constructor (broadcast, waitTime = TIMEOUT) {
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

  #_generatorFunction = function* (queue = this.#_queue) {
    let index = 0;
    for (index in queue) {
      if (queue[index].state === STATE.QUEUED) {
        yield queue[index++];
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
  push = async (itemPayload) => {
    if (!itemPayload) {
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
      this.#_broadcast(ACTION.QUEUE_PROCESS)
    }
  };

  /**
   * Get the next item to be processed
   * @param value Not yet implemented
   */
  next = (value) => this.#_generator.next(value);

  /**
   * Mark a queue item as locked, being processed
   * @param { Number } id The id of the item to be locked
   */
  lock = (id) => {
    if (typeof id !== 'number') {
      throw new TypeError('id should be a number');
    }
    const itemId = this.#_queue.findIndex((item) => item.queueId === id);
    if (itemId !== -1 && this.#_queue[itemId].state < STATE.LOCKED) {
      this.#_queue[itemId].state = STATE.LOCKED;
    }
  };

  /**
   * Mark a queue item for which processing has been finished, as processed
   * @param { Number } id The id of the item for which the processing has been finished
   */
  finish = (id) => {
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
    }
  };

  /**
   * Reset the queue
   */
  reset = () => {
    this.#_queue.length = 0;
    this.#_generator = null;
  }
}
