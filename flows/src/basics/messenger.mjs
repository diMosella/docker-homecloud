'use strict';

import { Worker } from 'cluster';
import { ChildProcess } from 'child_process';
import sleeper from './sleeper.mjs';
import { TIME_UNIT } from './constants.mjs';

const TIMEOUT = 0.1;

const messenger = (processRef) => {
  let _reject = null;
  let _resolve = null;
  const listener = (message) => _resolve(message);

  let targetProcess;
  if (processRef instanceof Worker || processRef instanceof ChildProcess) {
    targetProcess = processRef;
  } else if (typeof process.send === 'function') {
    targetProcess = process;
  } else if (typeof process.emit === 'function') {
    targetProcess = process;
    targetProcess.send = (message) => targetProcess.emit('message', message);
  } else {
    throw new TypeError('processRef should be either a Worker or a ChildProcess');
  }

  return {
    receive: new Promise((resolve, reject) => {
      _reject = reject;
      _resolve = resolve;
      targetProcess.once('message', listener);
    }),
    send: (message) => targetProcess.send(message),
    interrupt: () => {
      targetProcess.removeListener('message', listener);
      _reject('interrupted');
    }
  };
};

/**
 * Promise to emulate request - response for messages between (cluster) members
 * @param { Object } message
 * @param { Worker | ChildProcess } processRef
 * @param { Number } waitTime
 * @param { Number } timeUnit
 */
export default (message, processRef = null, waitTime = TIMEOUT, timeUnit = TIME_UNIT.SECOND) =>
  new Promise((resolve, reject) => {
    if (typeof message !== 'object') {
      return Promise.reject(new TypeError('message should be an object'));
    }
    if (processRef !== null && !(processRef instanceof Worker ||
        processRef instanceof ChildProcess)) {
      return Promise.reject(new TypeError('processRef should be a Worker or ChildProcess'));
    }
    if (typeof waitTime !== 'number') {
      return Promise.reject(new TypeError('waitTime should be a number'));
    }
    if (!(timeUnit in Object.values(TIME_UNIT))) {
      return Promise.reject(new TypeError('timeUnit should be in timeUnitEnum'));
    }

    const { sleep, interrupt : wakeUp } = sleeper(waitTime, timeUnit, true);
    const { send, receive, interrupt : tooLate } = messenger(processRef);
    Promise.allSettled([
      Promise.race([sleep, receive]),
      Promise.resolve(send(message))
    ]).then((results) => {
      const { status : s0, value : v0 } = results[0];
      if (s0 === 'fulfilled') {
        wakeUp();
        resolve(v0);
      } else {
        tooLate();
        reject(new Error('no response message'));
      }
    });
  });
