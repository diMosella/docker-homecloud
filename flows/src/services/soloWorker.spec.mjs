'use strict';

import cron from 'node-cron';
import chai from 'chai';
import sinon from 'sinon';
import soloWorker from './soloWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import utils from '../tasks/utils.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;
const { start } = soloWorker;

describe('(Service) soloWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a solo worker', () => {
    const receivedMessages = [];
    const originalSend = process.send;
    let testWorker;

    const getFolderDetailsStub = sinon.fake(async (context, next) => {
      context.flow.folder.lastModified = Date.now();
      context.flow.folder.details = [];
      return await next();
    });
    const checkForChangesStub = sinon.fake((_lastScan) => async (context, next) => {
      context.flow.folder.changes = [{ name: 'test.png' }];
      return await next();
    });
    const scheduleStub = sinon.fake((_freq, callback, _options) => {
      callback();
      return {
        stop: () => {},
        destroy: () => {}
      };
    });
    const sendStub = (message, skip = false) => !skip && receivedMessages.push(message);

    before(() => {
      sinon.replace(cloud, 'getFolderDetails', getFolderDetailsStub);
      sinon.replace(utils, 'checkForChanges', checkForChangesStub);
      sinon.replace(cron, 'schedule', scheduleStub);
      process.send = sendStub;
    });

    after(() => {
      sinon.restore();
      process.send = originalSend;
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
      expect(receivedMessages.find((item) => item.action === ACTION.AVAILLABLE));
      expect(receivedMessages.find((item) => item.action === ACTION.PONG));
      expect(receivedMessages.find((item) => item.action === ACTION.GOT));
    });
  });
});
