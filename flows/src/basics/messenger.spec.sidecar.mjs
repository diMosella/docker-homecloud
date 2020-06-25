'use strict';

process.on('message', (msg) => {
  switch (msg.type) {
    case 'request':
      process.send({ type: 'response' });
      break;
    default:
      break;
  }
});
