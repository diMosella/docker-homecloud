'use strict';

import { TIME_UNIT } from './constants.mjs';
import sleeper from './sleeper.mjs';

const TIMEOUT = 0.1;

const messenger = () => {
  let _reject = null;
  let _resolve = null;
  const listener = (message) => _resolve(message);
  return {
    receive: new Promise((resolve, reject) => {
      _reject = reject;
      _resolve = resolve;
      process.once('message', listener);
    }),
    send: (message) => process.send(message),
    interrupt: () => {
      process.removeListener('message', listener);
      _reject('interrupted');
    }
  };
};

export default (message, waitTime = TIMEOUT, timeUnit = TIME_UNIT.SECOND) => new Promise((resolve, reject) => {
  const { sleep, interrupt : wakeUp } = sleeper(waitTime, timeUnit, true);
  const { send, receive, interrupt : tooLate } = messenger();

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
      reject('no response message');
    }
  });
});
