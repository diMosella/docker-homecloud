'use strict';

import chai from 'chai';
import chaiHTTP from 'chai-http';
import sinon from 'sinon';
import serverWorker from './serverWorker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

chai.use(chaiHTTP);
const expect = chai.expect;
const request = chai.request;
const { start } = serverWorker;

describe('(Service) serverWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a http server', () => {
    const receivedMessages = [];
    const originalSend = process.send;
    let testWorker;

    const sendStub = (message, skip = false) => !skip && receivedMessages.push(message);

    after(() => {
      sinon.restore();
      testWorker.close();
    });

    afterEach(() => {
      process.send = originalSend;
    });

    it('should return index.json', async () => {
      process.send = sendStub;
      testWorker = start();
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
      expect(receivedMessages.filter((item) => item.action === ACTION.AVAILABLE)).to.have.length(1);
      const response = await request(testWorker)
        .get('/index.json');
      expect(response.statusCode).to.eql(200);
      expect(response.body).to.eql({ success: true });
    });
    it('should return status info (true)', async () => {
      const response = await request(testWorker)
        .get('/status');
      expect(response.statusCode).to.eql(200);
      expect(response.body).to.eql({ success: true });
    });
  });
});
