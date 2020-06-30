'use strict';

const messageHandler = (message) => {
  process.send(message);
};
process.on('message', messageHandler);
