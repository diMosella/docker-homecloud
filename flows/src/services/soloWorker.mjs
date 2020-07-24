'use strict';

import cron from 'node-cron';
import path from 'path';
import Flow from './flow.mjs';
import Queue from './queue.mjs';
import Cache from './cache.mjs';
import Log from './log.mjs';
import cloud from '../tasks/cloud.mjs';
import utils from '../tasks/utils.mjs';

import LastScan from '../basics/lastScan.mjs';
import { watch as watchConfig, tempFolder } from '../basics/config.mjs';
import { ACTION, STATE } from '../basics/constants.mjs';

const cronOptions = {
  scheduled: true,
  timezone: 'Europe/Amsterdam'
};

const expandWatchConfig = (result, item) => {
  const { frequency, locations } = item;
  for (const location of locations) {
    result.push({ frequency, location });
  }
  return result;
};

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

const inbox = async (message) => {
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
      if (payload && typeof payload.nodePath === 'string') {
        outbox({
          action: ACTION.CACHE_GOT,
          payload: payload.nodePath === '/' ? cache.all : cache.getByPath(payload.nodePath)
        });
      }
      break;
    case ACTION.CACHE_LISTEN:
      if (payload && typeof payload.nodePath === 'string') {
        const value = await cache.listen(payload.nodePath);
        outbox({
          action: ACTION.CACHE_HEARD,
          payload: value === true
        });
      }
      break;
    case ACTION.CACHE_SET:
      if (payload && typeof payload.nodePath === 'string' && typeof payload.value === 'boolean') {
        cache.set(payload.nodePath, payload.value);
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

const log = new Log();
const queue = new Queue(queueAction);
const cache = new Cache();
const taskList = [];

const queueChanges = (changes, location, scanTimestamp) => {
  if (queue.isProcessing === true) {
    log.debug('no changes added to queue because of processing');
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

const scanLocation = async (location, lastScan) => {
  if (queue.isProcessing === true) {
    log.debug(`no scan of location ${location} because of processing`);
    return Promise.resolve();
  }
  const scanTimestamp = Date.now();
  const context = {
    flow: {
      folder: {
        location
      }
    }
  };
  const error = await new Flow()
    .add(cloud.getFolderDetails)
    .add(utils.checkForChanges(lastScan))
    .go(context);
  if (!(error instanceof Error)) {
    queueChanges(context.flow.folder.changes, location, scanTimestamp);
  }
  lastScan.timestamp = scanTimestamp;
};

const start = () => {
  const processId = process.pid;

  process.on('message', inbox);

  const cronConfig = watchConfig.reduce(expandWatchConfig, []);
  for (const item of cronConfig) {
    const lastScan = new LastScan();
    const task = cron.schedule(
      item.frequency,
      () => scanLocation(item.location, lastScan),
      cronOptions
    );
    taskList.push(task);
    scanLocation(item.location, lastScan);
  }

  log.info(`Worker solo ${processId} at ${Date.now()}`);
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
