'use strict';

import cron from 'node-cron';
import path from 'path';
import Flow from './flow.mjs';
import Queue from './queue.mjs';
import cloud from '../tasks/cloud.mjs';
import { checkForChanges } from '../tasks/utils.mjs';

import LastScan from '../basics/lastScan.mjs';
import { watch as watchConfig, tempFolder } from '../basics/config.mjs';
import { ACTION, STATE } from '../basics/constants.mjs';

const getItem = () => {
  const { value, done } = queue.next();
  if (!done && value) {
    return value;
  }
  return null;
  //  FIXME: when finished (all tasks) clean Queue => implement in Queue itself?
};

const outbox = (message) => {
  process.send(message);
};

const inbox = (message) => {
  switch (message.action) {
    case ACTION.PING:
      outbox({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
      break;
    case ACTION.QUEUE_GET:
      outbox({ action: ACTION.QUEUE_GOT, payload: getItem() });
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
    default:
      break;
  }
};

const queue = new Queue(queueAction);
const taskList = [];

const queueChanges = (queue, changes, location, scanTimestamp) => {
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

const scanLocations = async (locations, queue, lastScan) => {
  const scanTimestamp = Date.now();
  // FIXME: deal with still running conversions
  let isError = false;
  for (const location of locations) {
    const context = {
      flow: {
        folder: {
          location
        }
      }
    };
    await new Flow()
      .add(cloud.getFolderDetails)
      .add(checkForChanges(lastScan))
      .go(context).catch((error) => {
        console.error(`${new Date().toISOString()}: Worker solo encountered error: ${error}`);
        isError = true;
      });
    if (!isError) {
      queueChanges(queue, context.flow.folder.changes, location, scanTimestamp);
    }
  }
  lastScan.timestamp = scanTimestamp;
};

const start = () => {
  const processId = process.pid;

  process.on('message', inbox);

  for (const item of watchConfig) {
    const lastScan = new LastScan();
    const task = cron.schedule(item.frequency, () => scanLocations(item.locations, queue, lastScan), {
      scheduled: true,
      timezone: 'Europe/Amsterdam'
    });
    taskList.push(task);
  }

  console.log(`${new Date().toISOString()}: Worker solo ${processId} at ${Date.now()}`);
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
