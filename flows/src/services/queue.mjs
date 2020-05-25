'use strict';

import { ACTION, STATE } from '../tasks/trigger.mjs';
import sleeper, { TIME_UNIT } from '../basics/sleeper.mjs';

const TIMEOUT = 10;

export default class Queue {
  #_queue = [];
  #_interrupts = [];
  #_generator;
  #_idGenerator;
  #_isInterrupting = false;
  #_isProcessing = false;
  #_notify;

  /**
   * Create a Queue
   * @param { function } notify The method to notify actions
   */
  constructor (notify) {
    this.#_notify = notify;
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

  push = async (itemPayload) => {
    this.#_queue.push(Object.assign({}, itemPayload, { qid: this.#_idGenerator.next().value, state: STATE.QUEUED }));
    const queueSize = this.#_queue.length;
    this.#_interruptAll();

    const { sleep, interrupt } = sleeper(TIMEOUT, TIME_UNIT.SECOND);
    this.#_interrupts.push(interrupt);
    await sleep;

    if (this.#_queue.length === queueSize) {
      this.#_generator = this.#_generatorFunction();
      this.#_notify({ action: ACTION.START })
    }
  };

  lock = (id) => {
    const itemId = this.#_queue.findIndex((item) => item.qid === id);
    if (itemId !== -1) {
      this.#_queue[itemId].state = STATE.LOCKED;
    }
  }

  next = (value) => this.#_generator.next(value);
}
