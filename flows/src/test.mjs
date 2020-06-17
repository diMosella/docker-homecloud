import sleeper from './basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from './basics/constants.mjs';
import cluster from 'cluster';
import Queue from './services/queue.mjs';
import Cache from './services/cache.mjs';
import { ensureFolder } from './tasks/cloud.mjs';

let sleep, interrupt;

const notifyWorkers = (msg) => {
  for (const id in cluster.workers) {
    cluster.workers[id].send(msg);
  };
};

const test1 = async () => {
  console.log('Before', Date.now());
  ({ sleep, interrupt } = sleeper(30, TIME_UNIT.SECOND));
  await sleep.catch((err) => console.log('err', err));
  console.log('After', Date.now());
}

const test2 = async () => {
  await sleeper(15, TIME_UNIT.SECOND).sleep.catch((err) => console.log('err', err));
  console.log('Interrupt', Date.now());
  interrupt();
}

const test3 = () => {
  const queue = new Queue(notifyWorkers);
  queue.push({ msg: 'test' });
}

const cacheTest = async (cloudCache, path, count) => {
  const pathParts = path.split('/').filter((part) => part !== '');
  const precedingParts = [];
  for (const nodeName of pathParts) {
    const parentNode = precedingParts.reduce((accummulator, value) => accummulator[value], cloudCache.get);
    const nodePath = `${precedingParts.length > 0 ? '/' : ''}${precedingParts.join('/')}/${nodeName}`;
    switch (typeof parentNode[nodeName]) {
      case 'undefined':
        cloudCache.set(nodePath, false);
        await ensureFolder(nodePath);
        cloudCache.set(nodePath, true);
        break;
      case 'boolean':
        if (!parentNode[nodeName]) {
          await cloudCache.listen(nodePath);
        }
        break;
      default:
        break;
    }
    precedingParts.push(nodeName);
    console.log('test', count, JSON.stringify(cloudCache.get, null, 2), precedingParts);
  }
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
  let cloudCache = new Cache();
  cacheTest(cloudCache, '/vanMoosel Fotos/originelenT/2020/2020-01/2020-01-23', 1).catch((error) => console.log('err1', error));
  cacheTest(cloudCache, '/vanMoosel Fotos/originelenT/2020/2020-02/2020-02-20', 2).catch((error) => console.log('err2', error));
} else if (cluster.isWorker) {
  process.on('message', (msg) => {
    console.log(`${new Date().toISOString()}: Worker ${process.pid} received message ('${ACTION.properties[msg.action].label}')`);
    process.send(msg);
  });
}
