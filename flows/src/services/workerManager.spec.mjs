'use strict';

import chai from 'chai';
import cluster from 'cluster';
import WorkerManager from './workerManager.mjs';
import sleeper from '../basics/sleeper.mjs';
import messenger from '../basics/messenger.mjs';
import { ACTION, TIME_UNIT, WORKER_TYPE } from '../basics/constants.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Service) workerManager', () => {
  const testManager = new WorkerManager();

  after(() => {
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

  it('should be a class.', () => {
    expect(testManager).to.be.a('object');
    expect(testManager).to.be.an.instanceof(WorkerManager);
  });

  describe('should have', () => {
    it('public method add', async () => {
      expect(testManager.add).to.be.a('function');
      assert.throws(testManager.add, TypeError);
      assert.throws(() => testManager.add(17), TypeError);
      testManager.add(WORKER_TYPE.SOLO);
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      assert.throws(() => testManager.add(WORKER_TYPE.SOLO), Error);
    });
    it('a message handler created', async () => {
      let processRef;
      for (const id in cluster.workers) {
        processRef = cluster.workers[id];
      }
      expect(processRef).to.be.a.instanceof(cluster.Worker);
      const message = await messenger({ action: ACTION.PING }, processRef);
      expect(message.action).to.eql(ACTION.PONG);
    });

    it('public method getTypeOf', () => {
      expect(testManager.getTypeOf).to.be.a('function');
      let count = 0;
      for (const id in cluster.workers) {
        const processId = cluster.workers[id].process.pid;
        expect(testManager.getTypeOf(processId)).to.eql(WORKER_TYPE.SOLO);
        count++;
      }
      expect(count).to.eql(1);
    });

    it('public method remove', () => {
      expect(testManager.remove).to.be.a('function');
      let processId;
      for (const id in cluster.workers) {
        processId = cluster.workers[id].process.pid;
      }
      testManager.remove(processId);
      expect(testManager.getTypeOf(processId)).to.eql(null);
    });
  });
});
