'use strict';

import cron from 'node-cron';
import chai from 'chai';
import sinon from 'sinon';
import soloWorker from './soloWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import utils from '../tasks/utils.mjs';
import Queue from './queue.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;
const assert = chai.assert;
const { start } = soloWorker;

describe('(Service) soloWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a solo worker', () => {
    const originalSend = process.send;
    let testWorker;

    const getFolderDetailsStub = sinon.fake(async (context, next) => {
      context.flow.folder.lastModified = Date.now();
      context.flow.folder.details = [];
      await next();
    });
    const checkForChangesStub = sinon.fake((_lastScan) => async (context, next) => {
      context.flow.folder.changes = [{ name: 'test.png' }];
      await next();
    });
    const scheduleStub = sinon.fake((_freq, callback, _options) => {
      callback();
      return {
        stop: () => {},
        destroy: () => {}
      };
    });
    const sendStub = sinon.fake();
    const nextStub = sinon.fake(() => ({ done: false, value: {} }));
    const pushStub = sinon.fake();
    const lockStub = sinon.fake();
    const finishStub = sinon.fake();

    before(() => {
      sinon.replace(cloud, 'getFolderDetails', getFolderDetailsStub);
      sinon.replace(utils, 'checkForChanges', checkForChangesStub);
      sinon.replace(cron, 'schedule', scheduleStub);
      sinon.replace(Queue.prototype, 'next', nextStub);
      sinon.replace(Queue.prototype, 'push', pushStub);
      sinon.replace(Queue.prototype, 'lock', lockStub);
      sinon.replace(Queue.prototype, 'finish', finishStub);
      process.send = sendStub;
    });

    after(() => {
      process.send = originalSend;
      sinon.restore();
      testWorker.close();
    });

    it('should start', async () => {
      testWorker = start();
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      process.emit('message', { action: ACTION.PING });
      process.emit('message', { action: ACTION.QUEUE_GET });
      process.emit('message', { action: ACTION.QUEUE_LOCK, payload: { queueId: 0 } });
      process.emit('message', { action: ACTION.QUEUE_FINISH, payload: { queueId: 0 } });
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      assert.ok(sendStub.callCount > 2);
      assert.ok(sendStub.getCall(0).firstArg.action === ACTION.AVAILABLE);
      assert.ok(sendStub.getCall(1).firstArg.action === ACTION.PONG);
      assert.ok(sendStub.getCalls().pop().firstArg.action === ACTION.QUEUE_GOT);
    });
  });
});
