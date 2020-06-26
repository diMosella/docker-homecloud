'use strict';

import { cpus } from 'os';
import cluster from 'cluster';
import { WORKER_TYPE } from './basics/constants.mjs';
import WorkerManager from './services/workerManager.mjs';

if (!cluster.isMaster) {
  throw new Error('This app should be run as non-worker process');
}

console.log(`${new Date().toISOString()}: Delegator ${process.pid} is running`);

const cpuCount = cpus().length;

const workerManager = new WorkerManager();

workerManager.add(WORKER_TYPE.SERVER);

cluster.on('online', (worker) => {
  console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} is online`);
  // TODO: if queue is running give this new worker the start signal
});

cluster.on('exit', (worker, code, signal) => {
  let isCausedByError = false;
  if (signal) {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} was killed by signal: ${signal}`);
  } else if (code !== 0) {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} exited with error: ${code}`);
    isCausedByError = true;
  } else {
    console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} finished`);
  }
  const type = workerManager.getTypeOf(worker.process.pid);
  workerManager.remove(worker.process.pid);

  if (!isCausedByError) {
    return;
  }

  workerManager.add(type);
});


//   const notify = (msg) => {
//     switch (msg.action) {
//       case ACTION.START:
//         for (const id in cluster.workerManager) {
//           const { value, done } = queue.next();
//           if (!done && value) {
//             value.flow.workerId = id;
//             cluster.workers[id].send({ action: ACTION.START, payload: { value, done } });
//           }
//         };
//         break;
//       default: break;
//     }
//   };

//   let queue = new Queue(notify);

//   const messageHandler = (pid) => async (message) => {
//     console.log(`${new Date().toISOString()}: Worker ${pid} delivered a message ('${ACTION.properties[message.action].label}')`);
//     switch (message.action) {
//       case ACTION.ADD:
//         queue.push(message.payload);
//         break;
//       case ACTION.LOCK:
//         queue.lock(message.payload.queueId);
//         break;
//       case ACTION.FINISH:
//         const { value, done } = queue.next();
//         if (!done && value) {
//           value.flow.workerId = message.payload.workerId;
//           cluster.workers[message.payload.workerId].send({ action: ACTION.START, payload: { value, done } });
//         } else {
//           queue = new Queue(notify);
//           cloudCache = new Cache();
//         }
//         // TODO: cleanup states, use queue item class
//         break;
//       case ACTION.PING:
//         cluster.workers[message.payload.workerId].send({ action: ACTION.PING, payload: { healthTimestamp: Date.now() } });
//         break;
//       default:
//         break;
//     }
//   };

// } else if (cluster.isWorker) {
//   const processFile = async (context) => {
//     await new Flow()
//       .add(checkForExistence)
//       .add(downloadFile)
//       .add(extractExif)
//       .add(deriveInfo)
//       .add(checkForExistence)
//       .add(convert)
//       .add(moveOriginal)
//       .add(uploadEdit)
//       // .add(addTags)
//       .go(context);
//     process.send({ action: ACTION.FINISH, payload: { queueId: context.flow.queueId, workerId: cluster.worker.id } });
//   };

//   process.on('message', (msg) => {
//     console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
//     switch (msg.action) {
//       case ACTION.START:
//         const { value, done } = msg.payload;
//         if (!done && value) {
//           console.log(`${new Date().toISOString()}: Worker ${process.pid} locking queueId: ${value.queueId}`);
//           process.send({ action: ACTION.LOCK, payload: { queueId: value.queueId } });
//           processFile(value);
//         }
//         break;
//       default:
//         break;
//     }
//   });
//   httpWorker(process.pid, cluster.worker.id);
// }
