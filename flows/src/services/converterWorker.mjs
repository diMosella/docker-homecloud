'use strict';

import Flow from './flow.mjs';
import cloud from '../tasks/cloud.mjs';
import exif from '../converters/exif.mjs';
import utils from '../tasks/utils.mjs';
import Log from '../services/log.mjs';
import { ACTION } from '../basics/constants.mjs';

const convertFile = async (context) => {
  if (typeof context !== 'object') {
    return Promise.reject(new TypeError('context must be an object'));
  }
  outbox({ action: ACTION.QUEUE_LOCK, payload: { queueId: context.queueId } });
  await new Flow()
    .add(cloud.checkForExistence)
    .add(cloud.downloadFile)
    .add(exif.extract)
    .add(utils.deriveInfo)
    .add(cloud.checkForExistence)
    .add(utils.convert)
    .add(cloud.moveOriginal)
    .add(cloud.uploadEdit)
  // // .add(addTags)
    .go(context);
  await utils.cleanTempFolder(context, () => {});
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

  const log = new Log();

  process.on('message', inbox);

  log.info(`Worker converter ${processId} at ${Date.now()}`);
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
