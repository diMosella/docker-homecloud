'use strict';

import { TIME_UNIT } from '../basics/constants.mjs';
import sleeper from '../basics/sleeper.mjs';

const TIMEOUT = 1;

/**
 * Cache to prevent excessive network traffic to NextCloud
 */
export default class Cache {
  #_cache = {};
  #_listeners = [];

  constructor () {
  }

  #_addListener = (path, callback) => {
    if (typeof path !== 'string') {
      throw new TypeError('A path must be a string!');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('A callback must be a string!');
    }
    const index = this.#_listeners.findIndex((listener) => listener.path === path);
    if (index === -1) {
      this.#_listeners.push({ path, callback });
    }
  };

  #_removeListener = (path) => {
    if (typeof path !== 'string') {
      throw new TypeError('A path must be a string!');
    }
    const index = this.#_listeners.findIndex((listener) => listener.path === path);
    if (index !== -1) {
      this.#_listeners.splice(index, 1);
    }
  };

  get get () {
    return this.#_cache;
  }

  getByPath = (path) => {
    if (typeof path !== 'string') {
      throw new TypeError('A path must be a string!');
    }

    const pathParts = path.split('/').filter((part) => part !== '');
    return pathParts.reduce((traverser, key) => {
      if (typeof traverser !== 'object' || traverser === null) {
        return null;
      }
      return traverser[key];
    }, this.#_cache);
  }

  set = (path, value) => {
    if (typeof path !== 'string') {
      throw new TypeError('A path must be a string!');
    }

    const pathParts = path.split('/').filter((part) => part !== '');
    const sanePath = `/${pathParts.join('/')}`;
    const field = pathParts.length > 0 && pathParts.pop();

    const parentNode = pathParts.reduce((traverser, key) => {
      if (!traverser.hasOwnProperty(key) || typeof traverser[key] !== 'object') {
        traverser[key] = {};
      }
      return traverser[key];
    }, this.#_cache);

    parentNode[field] = value;
    if (value === true) {
      for (const listener of this.#_listeners
          .filter((listener) => listener.path === sanePath)) {
            listener.callback(value);
            this.#_removeListener(sanePath);
      }
    }
    return this.#_cache;
  };

  listen = (path, waitTime = TIMEOUT, timeUnit = TIME_UNIT.SECOND) => {
    if (typeof path !== 'string') {
      throw new TypeError('A path must be a string!');
    }

    const sanePath = `/${path.split('/').filter((part) => part !== '').join('/')}`;

    const helper = () => {
      let _reject = null;
      let _resolve = null;
      const addListener = this.#_addListener;
      const removeListener = this.#_removeListener;
      const listener = (message) => _resolve(message);
      return {
        receive: new Promise((resolve, reject) => {
          _reject = reject;
          _resolve = resolve;
          addListener(sanePath, listener);
        }),
        interrupt: () => {
          removeListener(sanePath);
          _reject('interrupted');
        }
      };
    };

    return new Promise((resolve, reject) => {

      const { sleep, interrupt : wakeUp } = sleeper(waitTime, timeUnit, true);
      const { receive, interrupt : tooLate } = helper();

      Promise.race([sleep, receive])
        .then((result) => {
          wakeUp();
          resolve(result);
        }).catch((_error) => {
          tooLate();
          reject('no response message');
        });
    });
  };
}
