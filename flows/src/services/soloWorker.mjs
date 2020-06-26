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

const queue = new Queue();
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
          state: STATE.VALIDATED,
          tempPathOrg: path.resolve(`${tempFolder}/${path.basename(filePath)}`)
        }
      }
    });
  }
};

const scanLocations = async (locations, queue, lastScan) => {
  const scanTimestamp = Date.now();
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
      .go(context);
    queueChanges(queue, context.flow.folder.changes, location, scanTimestamp);
  }
  lastScan.timestamp = scanTimestamp;
};

const messageHandler = (message) => {
  switch (message.action) {
    case ACTION.PING:
      process.send({ action: ACTION.PONG, payload: { healthTimestamp: Date.now() } });
      break;
    default:
      break;
  }
};

export const startSolo = () => {
  const processId = process.pid;

  process.on('message', messageHandler);

  for (const item of watchConfig) {
    const lastScan = new LastScan();
    const task = cron.schedule(item.frequency, scanLocations(item.locations, queue, lastScan), {
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
      process.removeListener('message', messageHandler);
      taskList.length = 0;
    }
  };
};

if (process.argv.includes('--start')) {
  startSolo();
}
