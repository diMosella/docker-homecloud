'use strict';

import Flow from './flow.mjs';
import { checkForExistence, downloadFile } from '../tasks/cloud.mjs';
import { ACTION } from '../basics/constants.mjs';

const convertFile = async (context) => {
  outbox({ action: ACTION.QUEUE_LOCK, payload: { queueId: context.queueId } });
  await new Flow()
    .add(checkForExistence)
    .add(downloadFile)
  //   .add(extractExif)
  //   .add(deriveInfo)
  //   .add(checkForExistence)
  //   .add(convert)
  //   .add(moveOriginal)
  //   .add(uploadEdit)
  // // .add(addTags)
    .go(context);
  outbox({ action: ACTION.QUEUE_FINISH, payload: { queueId: context.queueId } });
  outbox({ action: ACTION.AVAILABLE });
};

const outbox = (message) => {
  process.send(message);
};

const inbox = (message) => {
  switch (message.action) {
    case ACTION.PING:
      outbox({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
      break;
    case ACTION.QUEUE_GOT:
      convertFile(message.payload);
      break;
    default:
      break;
  }
};

const start = () => {
  const processId = process.pid;

  process.on('message', inbox);

  console.log(`${new Date().toISOString()}: Worker converter ${processId} at ${Date.now()}`);
  outbox({ action: ACTION.AVAILABLE });
  return {
    close: () => {
      process.removeListener('message', inbox);
    }
  };
};

export default {
  start
};
