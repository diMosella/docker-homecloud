'use strict';

import { TIME_UNIT } from './constants.mjs';

/**
 * Sleep for an indicated number time units,
 * usage: await sleep(5), sleep for 5 minutes
 * @param {Number} waitTime the number of time units to sleep
 * @param {String} timeUnit the unit of time, as a string
 */
export default (waitTime, timeUnit = TIME_UNIT.MINUTE) => {
  let timer = null;
  return {
    sleep: new Promise(resolve => timer = setTimeout(resolve, waitTime * TIME_UNIT.properties[timeUnit].relativeValue * 1000)),
    interrupt: () => clearTimeout(timer)
  }
};
