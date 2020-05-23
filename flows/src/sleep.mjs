'use strict';
import { enumerate, EnumProperties } from './enum.mjs';

export const TIME_UNIT = enumerate(
    new EnumProperties('hour', 'hours', 'hh', 3600),
    new EnumProperties('minute', 'minutes', 'mm', 60),
    new EnumProperties('second', 'seconds', 'ss', 1)
);

/**
 * Sleep for an indicated number time units,
 * usage: await sleep(5), sleep for 5 minutes
 * @param {Number} waitTime the number of time units to sleep
 * @param {String} timeUnit the unit of time, as a string
 */
export default (waitTime, timeUnit = TIME_UNIT.MINUTE) =>
  new Promise(resolve => setTimeout(resolve, waitTime * TIME_UNIT.properties[timeUnit].relativeValue * 1000));
