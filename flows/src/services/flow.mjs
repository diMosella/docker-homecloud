'use strict';

import Log from './log.mjs';

const log = new Log();

export default class Flow {
  #_nodes = [];

  /**
   * Connect and applies all nodes of the Flow
   */
  #_join = () => {
    if (!Array.isArray(this.#_nodes)) {
      throw new TypeError('A Flow node stack must be an array!');
    }
    for (const node of this.#_nodes) {
      if (typeof node !== 'function') {
        throw new TypeError('A Flow node must be composed of functions!');
      }
    }

    /**
     * @param {Object} context
     * @param {function} next
     * @return {Promise}
     */
    return (context, next) => {

      // index of last called node
      let calledIndex = -1

      const dispatch = (index) => {
        if (index <= calledIndex) {
          return Promise.reject(new Error('next() called multiple times'));
        }
        calledIndex = index;
        const node = index === this.#_nodes.length
          ? next
          : this.#_nodes[index];
        if (!node) {
          return Promise.resolve();
        }
        try {
          return Promise.resolve(node(context, dispatch.bind(null, index + 1)));
        } catch (error) {
          return Promise.reject(error);
        }
      }
      return dispatch(0);
    }
  };

  constructor () {
    return this;
  }

  /**
   * Add a given node
   * @param { Function } node The step to add to the flow
   * @returns { Flow} The Flow, to enable chaining
   */
  add (node) {
    if (typeof node !== 'function') {
      throw new TypeError('node must be a function!');
    }
    this.#_nodes.push(node);
    return this;
  }

  /**
   * Perform the flow steps in sequence
   * @param { Object } context The context to operate on
   */
  async go (context) {
    return await this.#_join()(context).catch((error) => {
      log.error(`Flow encountered error: ${error}`);
      return Promise.resolve(error);
    });
  }
}
