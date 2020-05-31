'use strict';

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
        } catch (err) {
          return Promise.reject(err);
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
   * @param node
   * @returns The Flow
   */
  add (node) {
    if (typeof node !== 'function') {
      throw new TypeError('node must be a function!');
    }
    this.#_nodes.push(node);
    return this;
  }

  async go (context) {
    const errorHandler = (error) => console.error('error', error);
    const outcomeHandler = (outcome) => { if (outcome) console.log('outcome', outcome); };
    const outcome = await this.#_join()(context).catch(errorHandler);
    return outcomeHandler(outcome);
  }
}
