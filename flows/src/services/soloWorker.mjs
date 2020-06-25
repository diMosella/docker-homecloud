'use strict';

import { ACTION } from '../basics/constants.mjs';

export const startSolo = () => {
  const processId = process.pid;

  process.on('message', (message) => {
    switch (message.action) {
      case ACTION.PING:
        process.send({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
        break;
      default:
        break;
    }
  });

  const startTimestamp = Date.now();
  console.log(`${new Date().toISOString()}: Worker solo ${processId} at ${startTimestamp}`);
};

if (process.argv.includes('--start')) {
  startSolo();
}
