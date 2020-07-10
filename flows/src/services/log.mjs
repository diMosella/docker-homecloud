'use strict';

import { LOG_LEVEL } from '../basics/constants.mjs';

export default class Log {
  #_level = LOG_LEVEL.INFO;

  constructor (level) {
    if (!Log.instance) {
      if (typeof level !== 'undefined') {
        if (!(level in Object.values(LOG_LEVEL))) {
          throw new TypeError('level should be in LogLevelEnum');
        }
        this.#_level = level;
      } else if (typeof process.env.LOG_LEVEL !== 'undefined' &&
          typeof LOG_LEVEL.findBy('label', process.env.LOG_LEVEL) !== 'undefined') {
        this.#_level = LOG_LEVEL.findBy('label', process.env.LOG_LEVEL);
      }

      if (typeof process.env.LOG_LEVEL === 'undefined') {
        process.env.LOG_LEVEL = LOG_LEVEL.getProperty(this.#_level, 'label');
      }
      Log.instance = this;
    } else if (typeof level !== 'undefined') {
      throw new Error('level can only be set when the Log singleton is instanciated');
    }
    return Log.instance;
  }

  #_format = (level, message) => {
    return `${new Date().toISOString()} - ${level}: ${message}`;
  };

  error (message, ...additionalInfo) {
    console.error(this.#_format(Log.prototype.error.name, message), additionalInfo);
  };

  warn (message, ...additionalInfo) {
    if (this.#_level >= LOG_LEVEL.WARN) {
      console.warn(this.#_format(Log.prototype.warn.name, message), additionalInfo);
    }
  };

  info (message, ...additionalInfo) {
    if (this.#_level >= LOG_LEVEL.INFO) {
      console.info(this.#_format(Log.prototype.info.name, message), additionalInfo);
    }
  };

  debug (message, ...additionalInfo) {
    if (this.#_level >= LOG_LEVEL.DEBUG) {
      console.debug(this.#_format(Log.prototype.debug.name, message), additionalInfo);
    }
  };
}
