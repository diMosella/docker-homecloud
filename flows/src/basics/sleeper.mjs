'use strict';

import { TIME_UNIT } from './constants.mjs';

/**
 * Sleep for an indicated number time units,
 * usage: await sleep(5, TIME_UNIT.SECOND), sleep for 5 seconds
 * @param {Number} waitTime the number of time units to sleep
 * @param {String} [timeUnit=TIME_UNIT.MINUTE] the unit of time, as a number
 * @param {boolean} [shouldReject=false] whether the promise should reject when timeout has been reached
 */
export default (waitTime, timeUnit = TIME_UNIT.MINUTE, shouldReject = false) => {
  let _timer = null;
  let _reject = null;
  return {
    sleep: new Promise((resolve, reject) => {
      _reject = reject;
      _timer = setTimeout(shouldReject ? reject : resolve, waitTime * TIME_UNIT.properties[timeUnit].relativeValue * 1000);
    }),
    interrupt: () => {
      clearTimeout(_timer);
      _reject('interrupted');
    }
  };
};
