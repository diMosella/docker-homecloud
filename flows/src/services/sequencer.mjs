'use strict';

export default class {
  #_sequence = [];

  #_createStep = () => {
    let _resolve = null;
    return {
      promise: new Promise((resolve) => {
        _resolve = resolve;
      }),
      resolve: () => {
        _resolve();
      }
    };
  };

  start () {
    const index = this.#_sequence.push(this.#_createStep()) - 1;
    return index > 0
      ? this.#_sequence[index - 1].promise
      : Promise.resolve()
  };

  done () {
    const step = this.#_sequence.shift();
    step.resolve();
  };
};
