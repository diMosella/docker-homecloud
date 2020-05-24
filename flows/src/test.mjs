import sleeper, { TIME_UNIT } from './sleeper.mjs';
import { ACTION } from './trigger.mjs';
import cluster from 'cluster';
import Queue from './queue.mjs';

let sleep, interrupt;

const notifyWorkers = (msg) => {
  for (const id in cluster.workers) {
    cluster.workers[id].send(msg);
  };
};

const test1 = async () => {
  console.log('Before', Date.now());
  ({ sleep, interrupt } = sleeper(30, TIME_UNIT.SECOND));
  await sleep;
  console.log('After', Date.now());
}

const test2 = async () => {
  await sleeper(10, TIME_UNIT.SECOND).sleep;
  console.log('Interrupt', Date.now());
  interrupt();
}

const test3 = () => {
  const queue = new Queue(notifyWorkers);
  queue.push({ msg: 'test' });
}

const messageHandler = (worker) => async (msg) => {
  console.log(`${new Date().toISOString()}: Worker ${worker.process.pid} delivered a message ('${ACTION.properties[msg.action].label}')`);
  worker.kill();
};

if(cluster.isMaster) {
  console.log(`${new Date().toISOString()}: Master ${process.pid} is running`);
  const worker = cluster.fork();
  worker.on('message', messageHandler(worker));

  test1();
  test2();
  test3();
} else if (cluster.isWorker) {
  process.on('message', (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
    process.send(msg);
  });
}


