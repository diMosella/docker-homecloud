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
  if (typeof process.send === 'function' && typeof process.once === 'function' &&
      typeof process.removeListener === 'function') {
    targetProcess = process;
  } else if (processRef instanceof Worker || processRef instanceof ChildProcess) {
    targetProcess = processRef;
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
 * @param { String } message
 * @param { Worker | ChildProcess } processRef
 * @param { Number } waitTime
 * @param { Number } timeUnit
 */
export default (message, processRef, waitTime = TIMEOUT, timeUnit = TIME_UNIT.SECOND) => new Promise((resolve, reject) => {
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
