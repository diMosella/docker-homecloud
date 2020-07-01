'use strict';

'use strict';

import chai from 'chai';
import sinon from 'sinon';
import converterWorker from './converterWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;
const { start } = converterWorker;

describe('(Service) converterWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a converter worker', () => {
    const receivedMessages = [];
    const originalSend = process.send;
    let testWorker;

    const checkForExistenceStub = sinon.fake(async (context, next) => {
      return await next();
    });
    const downloadFileStub = sinon.fake(async (context, next) => {
      return await next();
    });
    const sendStub = (message, skip = false) => !skip && receivedMessages.push(message);

    before(() => {
      sinon.replace(cloud, 'checkForExistence', checkForExistenceStub);
      sinon.replace(cloud, 'downloadFile', downloadFileStub);
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
      expect(receivedMessages.filter((item) => item.action === ACTION.AVAILABLE)).to.have.length(1);
      process.emit('message', { action: ACTION.PING });
      process.emit('message', { action: ACTION.QUEUE_GOT, payload: { queueId: 0 } });
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      expect(receivedMessages.filter((item) => item.action === ACTION.AVAILABLE)).to.have.length(2);
      expect(receivedMessages.filter((item) => item.action === ACTION.PONG)).to.have.length(1);
      expect(receivedMessages.filter((item) => item.action === ACTION.QUEUE_LOCK)).to.have.length(1);
      expect(receivedMessages.filter((item) => item.action === ACTION.QUEUE_FINISH)).to.have.length(1);
    });
  });
});
