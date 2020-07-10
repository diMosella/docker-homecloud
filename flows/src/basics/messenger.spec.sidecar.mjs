'use strict';

import messenger from './messenger.mjs';

if (process.argv.includes('--sender')) {
  const sending = async () => {
    const listener = (msg) => {
      const { type } = msg;
      if (type === 'response') {
        process.send({ type });
      }
    };
    process.on('message', listener);
    const transporter = messenger({ type: 'request' });
    process.send({
      type: 'type',
      value: typeof transporter,
      isPromise: transporter instanceof Promise
    });
    await transporter;
    process.send({ type: 'final' });
    process.removeListener('message', listener);
  };
  sending();
} else {
  process.once('message', (msg) => {
    switch (msg.type) {
      case 'request':
        process.send({ type: 'response' });
        break;
      default:
        break;
    }
  });
}
