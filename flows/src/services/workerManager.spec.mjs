'use strict';

import chai from 'chai';
import sinon from 'sinon';
import cluster from 'cluster';
import WorkerManager from './workerManager.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT, WORKER_TYPE } from '../basics/constants.mjs';

const expect = chai.expect;
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
    expect(testManager).to.be.a('object');
    expect(testManager).to.be.an.instanceof(WorkerManager);
  });

  describe('should have', () => {
    it('public method add', async () => {
      expect(testManager.add).to.be.a('function');
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
      processRef.send({ action: ACTION.QUEUE_LOCK, payload: { queueId: 0 }, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_FINISH, payload: { queueId: 0 }, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_PROCESS, shouldEcho: true });
      processRef.send({ action: ACTION.QUEUE_FINAL, shouldEcho: true });
      processRef.send({ action: ACTION.CACHE_GET, shouldEcho: true });
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      assert.equal(addConvertersStub.callCount, 1);
      assert.equal(removeConvertersStub.callCount, 1);
      assert.equal(resetRetryStub.callCount, 1);
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

    it('public method assignTask', () => {
      expect(testManager.assignTask).to.be.a('function');
      let processId;
      for (const id in cluster.workers) {
        processId = cluster.workers[id].process.pid;
      }
      testManager.assignTask(processId);
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
