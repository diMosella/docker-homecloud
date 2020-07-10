'use strict';

import chai from 'chai';
import sinon from 'sinon';
import cluster from 'cluster';
import WorkerManager from './workerManager.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT, WORKER_TYPE } from '../basics/constants.mjs';


const assert = chai.assert;

describe('(Service) workerManager', () => {
  const addConvertersStub = sinon.fake();
  const removeConvertersStub = sinon.fake();
  const resetRetryStub = sinon.fake();
  const processes = {
    addConverters: addConvertersStub,
    removeConverters: removeConvertersStub,
    resetRetry: resetRetryStub
  };
  let testManager;

  after(() => {
    sinon.restore();
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

  it('should throw without params', () => {
    assert.throws(() => new WorkerManager(), TypeError);
  });

  it('should be a class.', () => {
    testManager = new WorkerManager(processes);
    assert.typeOf(testManager, 'object');
    assert.instanceOf(testManager, WorkerManager);
  });

  describe('should have', () => {
    it('public method add', async () => {
      assert.typeOf(testManager.add, 'function');
      assert.throws(testManager.add, TypeError);
      assert.throws(() => testManager.add(17), TypeError);
      testManager.add(WORKER_TYPE.SOLO);
      await sleeper(0.2, TIME_UNIT.SECOND).sleep;
      assert.throws(() => testManager.add(WORKER_TYPE.SOLO), Error);
    });
    it('adds message event handler', async () => {
      let processRef;
      for (const id in cluster.workers) {
        processRef = cluster.workers[id];
      }
      processRef.send({ action: ACTION.AVAILABLE, shouldEcho: true });
      processRef.send({ action: ACTION.PING, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_PROCESS, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_LOCK, payload: { queueId: 0 }, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_FINISH, payload: { queueId: 0 }, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_FINAL, shouldEcho: true });
      processRef.send({ action: ACTION.CACHE_GET, shouldEcho: true });
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      assert.equal(addConvertersStub.callCount, 1);
      assert.equal(removeConvertersStub.callCount, 1);
      assert.equal(resetRetryStub.callCount, 1);
    });
    it('public method getTypeOf', () => {
      assert.typeOf(testManager.getTypeOf, 'function');
      let count = 0;
      for (const id in cluster.workers) {
        const processId = cluster.workers[id].process.pid;
        assert.equal(testManager.getTypeOf(processId), WORKER_TYPE.SOLO);
        count++;
      }
      assert.equal(count, 1);
    });

    it('public method assignTask', () => {
      assert.typeOf(testManager.assignTask, 'function');
      let processId;
      for (const id in cluster.workers) {
        processId = cluster.workers[id].process.pid;
      }
      testManager.assignTask(processId);
    });

    it('public method remove', () => {
      assert.typeOf(testManager.remove, 'function');
      let processId;
      for (const id in cluster.workers) {
        processId = cluster.workers[id].process.pid;
      }
      testManager.remove(processId);
      assert.isNull(testManager.getTypeOf(processId));
    });
  });
});
