'use strict';

import cron from 'node-cron';
import path from 'path';
import Flow from './flow.mjs';
import Queue from './queue.mjs';
import Cache from './cache.mjs';
import cloud from '../tasks/cloud.mjs';
import utils from '../tasks/utils.mjs';

import LastScan from '../basics/lastScan.mjs';
import { watch as watchConfig, tempFolder } from '../basics/config.mjs';
import { ACTION, STATE } from '../basics/constants.mjs';

const getItem = () => {
  const { value, done } = queue.next();
  if (!done && value) {
    return value;
  }
  return null;
};

const outbox = (message) => {
  process.send(message);
};

const inbox = (message) => {
  const { action, payload } = message;
  switch (action) {
    case ACTION.PING:
      outbox({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
      break;
    case ACTION.QUEUE_GET:
      outbox({ action: ACTION.QUEUE_GOT, payload: getItem() });
      break;
    case ACTION.QUEUE_LOCK:
      if (payload && typeof payload.queueId === 'number') {
        queue.lock(payload.queueId);
      }
      break;
    case ACTION.QUEUE_FINISH:
      if (payload && typeof payload.queueId === 'number') {
        queue.finish(payload.queueId);
      }
      break;
    case ACTION.CACHE_GET:
      if (payload && typeof payload.filePath === 'string') {
        outbox({ action: ACTION.CACHE_GOT, payload: cache.getByPath(message.payload.filePath) });
      }
      break;
    default:
      break;
  }
};

const queueAction = (action) => {
  switch (action) {
    case ACTION.QUEUE_PROCESS:
      outbox({ action });
      break;
    case ACTION.QUEUE_FINAL:
      outbox({ action });
      queue.reset();
      break;
    default:
      break;
  }
};

const queue = new Queue(queueAction);
const cache = new Cache();
const taskList = [];

const queueChanges = (changes, location, scanTimestamp) => {
  if (queue.isProcessing === true) {
    console.log('already qC');
    return;
  }
  for (const change of changes) {
    const filePath = path.resolve(`${location}/${change.name}`);
    queue.push({
      flow: {
        file: {
          path: filePath,
          folder: location,
          details: change,
          timestamp: scanTimestamp,
          state: STATE.QUEUED,
          tempPathOrg: path.resolve(`${tempFolder}/${path.basename(filePath)}`)
        }
      }
    });
  }
};

const scanLocations = async (locations, lastScan) => {
  if (queue.isProcessing === true) {
    console.log('already sL');
    return;
  }
  const scanTimestamp = Date.now();
  for (const location of locations) {
    let isError = false;
    const context = {
      flow: {
        folder: {
          location
        }
      }
    };
    await new Flow()
      .add(cloud.getFolderDetails)
      .add(utils.checkForChanges(lastScan))
      .go(context).catch((error) => {
        console.error(`${new Date().toISOString()}: Worker solo encountered error: ${error}`);
        isError = true;
      });
    if (!isError) {
      queueChanges(context.flow.folder.changes, location, scanTimestamp);
    }
  }
  lastScan.timestamp = scanTimestamp;
};

const start = () => {
  const processId = process.pid;

  process.on('message', inbox);

  for (const item of watchConfig) {
    const lastScan = new LastScan();
    const task = cron.schedule(item.frequency, () => scanLocations(item.locations, lastScan), {
      scheduled: true,
      timezone: 'Europe/Amsterdam'
    });
    taskList.push(task);
  }

  console.log(`${new Date().toISOString()}: Worker solo ${processId} at ${Date.now()}`);
  outbox({ action: ACTION.AVAILABLE });

  return {
    close: () => {
      for (const task of taskList) {
        task.stop();
        task.destroy();
      }
      process.removeListener('message', inbox);
      taskList.length = 0;
    }
  };
};

export default {
  start
};
