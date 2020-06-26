'use strict';

export default class {
  #_timestamp = 0;

  constructor (timestamp = 0) {
    this.timestamp = timestamp;
  }

  set timestamp (timestamp) {
    if (typeof timestamp !== 'number' || timestamp < this.#_timestamp) {
      throw new TypeError('timestamp should be an always increasing number');
    }
    this.#_timestamp = timestamp;
  }

  get timestamp () {
    return this.#_timestamp;
  }
}
