'use strict';

const freeze = obj => Object.freeze(obj);

export default class Message {
  #_action;
  #_payload;

  /**
   * Create a message
   * @param action The action the message is representing
   * @param payload The additional information as context for the action
   */
  constructor (action, payload) {
    this.#_action = action;
    this.#_payload = payload;
    return freeze(this);
  }

  get action () {
    return this.#_action;
  }

  get payload () {
    return this.#_payload;
  }
}
