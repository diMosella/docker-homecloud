'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import cron from 'node-cron';
import { resolve, basename } from 'path';
import { ACTION, STATE } from './basics/constants.mjs';
import { watch as watchConfig, tempFolder } from './basics/config.mjs';
import httpWorker from './services/worker.mjs';
import Queue from './services/queue.mjs';
import Flow from './services/flow.mjs';
import { getFolderDetails, checkForExistence, downloadFile, moveOriginal, uploadEdit, addTags } from './tasks/cloud.mjs';
import { checkForChanges, deriveInfo, convert } from './tasks/utils.mjs';
import { extractExif } from './tasks/exif.mjs';

if(cluster.isMaster) {
  console.log(`${new Date().toISOString()}: Master ${process.pid} is running`);

  watchConfig.forEach ((item) => {
    let lastWatch = 0;
    const getLastWatch = () => lastWatch;
    cron.schedule(item.frequency, async () => {
      let count = 0;
      const watched = Date.now();
      item.paths.forEach(async (path) => {
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
        context.flow.folder.changes.forEach((fileDetails) => {
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
        });
      });
    }, {
      scheduled: true,
      timezone: 'Europe/Amsterdam'
    });
  });

  const notify = (msg) => {
    switch (msg.action) {
      case ACTION.START:
        for (const id in cluster.workers) {
          const { value, done } = queue.next();
          if (!done && value) {
            cluster.workers[id].send({ action: ACTION.START, payload: { value, done } });
          }
        };
        break;
      default: break;
    }
  };

  const queue = new Queue(notify);
  const ensuredPaths = [];
  const ensureInProgressPaths = [];

  const messageHandler = (id) => async (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${id} delivered a message ('${ACTION.properties[msg.action].label}')`);
    switch (msg.action) {
      case ACTION.ADD:
        queue.push(msg.payload);
        break;
      case ACTION.LOCK:
        queue.lock(msg.payload.qid);
        break;
      case ACTION.FINISH:
        const { value, done } = queue.next();
        if (!done && value) {
          cluster.workers[msg.payload.wid].send({ action: ACTION.START, payload: { value, done } });
        } // TODO: clear queue, queue states, queue item class, ensur(ed|ing)Paths
        break;
      case ACTION.PING:
        cluster.workers[msg.payload.wid].send({ action: ACTION.PING, payload: { healthTimestamp: Date.now() } });
        break;
      case ACTION.CAN_ENSURE:
        console.log('can', msg.payload.path);
        const inProgress = ensureInProgressPaths.includes(msg.payload.path);
        const isEnsured = ensuredPaths.includes(msg.payload.path);
        const canEnsure = !inProgress && !isEnsured;
        const ensuredCommonPath = ensuredPaths
            .filter((path) => msg.payload.path.startsWith(path))
            .sort((pathA, pathB) => pathA.length - pathB.length)
            .pop() || '';

        const toEnsure = msg.payload.path.substring(ensuredCommonPath.length + 1).split('/');
        if (canEnsure && msg.payload.willEnsure) {
          let accummulatedPath = ensuredCommonPath;
          toEnsure.forEach((folderName) => {
            accummulatedPath = resolve(`${accummulatedPath}/${folderName}`);
            if (!ensureInProgressPaths.includes(accummulatedPath)) {
              ensureInProgressPaths.push(accummulatedPath);
            }
          });
        }

        cluster.workers[msg.payload.wid].send({
          action: ACTION.ENSURE,
          payload: {
            path: msg.payload.path,
            canEnsure,
            isEnsured,
            toEnsure
          }
        });
        break;
      case ACTION.FINISH_ENSURE:
        console.log('finish', msg.payload.path);
        const pathParts = msg.payload.path.split('/');
        let accummulatedPath = '';
        pathParts.forEach((folderName) => {
          accummulatedPath = resolve(`${accummulatedPath}/${folderName}`);
          const index = ensureInProgressPaths.indexOf(accummulatedPath);
          if (index !== -1) {
            ensureInProgressPaths.splice(index, 1);
          }
          if (!ensuredPaths.includes(accummulatedPath)) {
            ensuredPaths.push(accummulatedPath);
          }
        });
        console.log('ensuredPaths', ensuredPaths);
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
      .add(addTags)
      .go(context);
    process.send({ action: ACTION.FINISH, payload: { qid: context.qid, wid: cluster.worker.id } });
  };

  process.on('message', (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
    switch (msg.action) {
      case ACTION.START:
        const { value, done } = msg.payload;
        if (!done && value) {
          console.log(`${new Date().toISOString()}: Worker ${process.pid} locking qid: ${value.qid}`);
          process.send({ action: ACTION.LOCK, payload: { qid: value.qid } });
          processFile(Object.assign({}, value, { wid: cluster.worker.id }));
        }
        break;
      default:
        break;
    }
  });
  httpWorker(process.pid, cluster.worker.id);
}
