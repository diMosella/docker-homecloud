'use strict';

import chai from 'chai';
import chaiHTTP from 'chai-http';
import sinon from 'sinon';
import serverWorker from './serverWorker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

chai.use(chaiHTTP);
const expect = chai.expect;
const assert = chai.assert;
const request = chai.request;
const { start } = serverWorker;

describe('(Service) serverWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a http server', () => {
    const originalSend = process.send;
    let testWorker;

    const sendStub = sinon.fake();

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
      assert.ok(sendStub.calledOnceWithExactly({ action: ACTION.AVAILABLE }));
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
