'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import cron from 'node-cron';
import { resolve, basename } from 'path';
import { ACTION, STATE } from './basics/constants.mjs';
import { watch as watchConfig, tempFolder } from './basics/config.mjs';
import httpWorker from './services/worker.mjs';
import Queue from './services/queue.mjs';
import CloudCache from './services/cache.mjs';
import Flow from './services/flow.mjs';
import { getFolderDetails, checkForExistence, downloadFile, moveOriginal, uploadEdit, addTags } from './tasks/cloud.mjs';
import { checkForChanges, deriveInfo, convert } from './tasks/utils.mjs';
import { extractExif } from './tasks/exif.mjs';

if(cluster.isMaster) {
  console.log(`${new Date().toISOString()}: Master ${process.pid} is running`);

  let cloudCache = new CloudCache();

  for (const item of watchConfig) {
    let lastWatch = 0;
    const getLastWatch = () => lastWatch;
    cron.schedule(item.frequency, async () => {
      let count = 0;
      const watched = Date.now();
      for (const path of item.paths) {
        const context = {
          flow: {
            folder: {
              name: path
            }
          }
        };
        await new Flow()
          .add(getFolderDetails)
          .add(checkForChanges(getLastWatch))
          .go(context);
        if (++count === item.paths.length) {
          lastWatch = Date.now();
        }
        for (const fileDetails of context.flow.folder.changes) {
          const filePath = resolve(`${context.flow.folder.name}/${fileDetails.name}`);
          queue.push({
            flow: {
              file: {
                path: filePath,
                folder: context.flow.folder.name,
                details: fileDetails,
                timestamp: watched,
                state: STATE.VALIDATED,
                tempPathOrg: resolve(`${tempFolder}/${basename(filePath)}`)
              }
            }
          });
        }
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Amsterdam'
    });
  }

  const notify = (msg) => {
    switch (msg.action) {
      case ACTION.START:
        for (const id in cluster.workers) {
          const { value, done } = queue.next();
          if (!done && value) {
            value.flow.workerId = id;
            cluster.workers[id].send({ action: ACTION.START, payload: { value, done } });
          }
        };
        break;
      default: break;
    }
  };

  let queue = new Queue(notify);

  const messageHandler = (pid) => async (message) => {
    console.log(`${new Date().toISOString()}: Worker ${pid} delivered a message ('${ACTION.properties[message.action].label}')`);
    switch (message.action) {
      case ACTION.ADD:
        queue.push(message.payload);
        break;
      case ACTION.LOCK:
        queue.lock(message.payload.queueId);
        break;
      case ACTION.FINISH:
        const { value, done } = queue.next();
        if (!done && value) {
          value.flow.workerId = message.payload.workerId;
          cluster.workers[message.payload.workerId].send({ action: ACTION.START, payload: { value, done } });
        } else {
          queue = new Queue(notify);
          cloudCache = new CloudCache();
        }
        // TODO: cleanup states, use queue item class
        break;
      case ACTION.PING:
        cluster.workers[message.payload.workerId].send({ action: ACTION.PING, payload: { healthTimestamp: Date.now() } });
        break;
      default:
        break;
    }
  };

  const numberOfWorkers = cpus().length;

  console.log(`${new Date().toISOString()}: Master cluster setting up ${numberOfWorkers} workers...`);

  for(var i = 0; i < numberOfWorkers; i++) {
      cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler(cluster.workers[id].process.pid));
  }

  cluster.on('online', (worker) => {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
    console.log(`${new Date().toISOString()}: Starting a new worker`);
    cluster.fork();
  });

} else if (cluster.isWorker) {
  const processFile = async (context) => {
    await new Flow()
      .add(checkForExistence)
      .add(downloadFile)
      .add(extractExif)
      .add(deriveInfo)
      .add(checkForExistence)
      .add(convert)
      .add(moveOriginal)
      .add(uploadEdit)
      // .add(addTags)
      .go(context);
    process.send({ action: ACTION.FINISH, payload: { queueId: context.flow.queueId, workerId: cluster.worker.id } });
  };

  process.on('message', (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
    switch (msg.action) {
      case ACTION.START:
        const { value, done } = msg.payload;
        if (!done && value) {
          console.log(`${new Date().toISOString()}: Worker ${process.pid} locking queueId: ${value.queueId}`);
          process.send({ action: ACTION.LOCK, payload: { queueId: value.queueId } });
          processFile(value);
        }
        break;
      default:
        break;
    }
  });
  httpWorker(process.pid, cluster.worker.id);
}
