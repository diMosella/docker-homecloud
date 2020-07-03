'use strict';

'use strict';

import chai from 'chai';
import sinon from 'sinon';
import converterWorker from './converterWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import exif from '../tasks/exif.mjs';
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

    const checkForExistenceStub = sinon.fake(async (context, next) => {
      await next();
    });
    const downloadFileStub = sinon.fake(async (context, next) => {
      await next();
    });
    const extractExifStub = sinon.fake(async (context, next) => {
      await next();
    });
    const sendStub = sinon.fake();

    before(() => {
      sinon.replace(cloud, 'checkForExistence', checkForExistenceStub);
      sinon.replace(cloud, 'downloadFile', downloadFileStub);
      sinon.replace(exif, 'extractExif', extractExifStub);
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
      process.emit('message', { action: ACTION.QUEUE_GOT, payload: { queueId: 0 } });
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      expect(sendStub.callCount).to.eql(5);
      assert.ok(sendStub.getCall(0).firstArg.action === ACTION.AVAILABLE);
      assert.ok(sendStub.getCall(1).firstArg.action === ACTION.PONG);
      assert.ok(sendStub.getCall(2).firstArg.action === ACTION.QUEUE_LOCK);
      assert.ok(sendStub.getCall(3).firstArg.action === ACTION.QUEUE_FINISH);
      assert.ok(sendStub.getCall(4).firstArg.action === ACTION.AVAILABLE);
    });
  });
});
