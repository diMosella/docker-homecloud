'use strict';

'use strict';

import chai from 'chai';
import sinon from 'sinon';
import converterWorker from './converterWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import exif from '../converters/exif.mjs';
import utils from '../tasks/utils.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;
const assert = chai.assert;
const { start } = converterWorker;

describe('(Service) converterWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a converter worker', () => {
    const originalSend = process.send;
    let testWorker;

    const checkForExistenceStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const downloadFileStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const extractStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const deriveInfoStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const convertStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const moveOriginalStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const uploadEditStub = sinon.fake(async (_context, next) => {
      await next();
    });
    const sendStub = sinon.fake();

    before(() => {
      sinon.replace(cloud, 'checkForExistence', checkForExistenceStub);
      sinon.replace(cloud, 'downloadFile', downloadFileStub);
      sinon.replace(exif, 'extract', extractStub);
      sinon.replace(utils, 'deriveInfo', deriveInfoStub);
      sinon.replace(utils, 'convert', convertStub);
      sinon.replace(cloud, 'moveOriginal', moveOriginalStub);
      sinon.replace(cloud, 'uploadEdit', uploadEditStub);
      process.send = sendStub;
    });

    after(() => {
      process.send = originalSend;
      sinon.restore();
      testWorker.close();
    });

    it('should start', async () => {
      testWorker = start();
      await sleeper(0.15, TIME_UNIT.SECOND).sleep;
      process.emit('message', { action: ACTION.PING });
      process.emit('message', { action: ACTION.QUEUE_GOT, payload: { queueId: 0 } });
      await sleeper(0.15, TIME_UNIT.SECOND).sleep;
      assert.equal(checkForExistenceStub.callCount, 2);
      assert.equal(downloadFileStub.callCount, 1);
      assert.equal(extractStub.callCount, 1);
      assert.equal(deriveInfoStub.callCount, 1);
      assert.equal(convertStub.callCount, 1);
      assert.equal(moveOriginalStub.callCount, 1);
      assert.equal(uploadEditStub.callCount, 1);
      assert.equal(sendStub.callCount, 5);
      assert.strictEqual(sendStub.getCall(0).firstArg.action, ACTION.AVAILABLE);
      assert.strictEqual(sendStub.getCall(1).firstArg.action, ACTION.PONG);
      assert.strictEqual(sendStub.getCall(2).firstArg.action, ACTION.QUEUE_LOCK);
      assert.strictEqual(sendStub.getCall(3).firstArg.action, ACTION.QUEUE_FINISH);
      assert.strictEqual(sendStub.getCall(4).firstArg.action, ACTION.AVAILABLE);
    });
  });
});
