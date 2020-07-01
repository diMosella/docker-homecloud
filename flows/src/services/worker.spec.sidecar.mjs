'use strict';

const messageHandler = (message) => {
  if (message.shouldEcho) {
    process.send({ action: message.action, payload: message.payload });
  }
};
process.on('message', messageHandler);
