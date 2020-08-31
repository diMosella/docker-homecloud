'use strict';

import chai from 'chai';
import chaiHTTP from 'chai-http';
import sinon from 'sinon';
import serverWorker from './serverWorker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

chai.use(chaiHTTP);

const assert = chai.assert;
const request = chai.request;
const { start } = serverWorker;

describe('(Service) serverWorker.start', () => {
  it('should be a function', async () => {
    assert.typeOf(start, 'function');
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
      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.body, { success: true });
    });
    it('should return status info (true)', async () => {
      const response = await request(testWorker)
        .get('/status');
      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.body, { success: true });
    });
  });
});
