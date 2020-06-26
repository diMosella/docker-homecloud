'use strict';

import chai from 'chai';
import chaiHTTP from 'chai-http';
import serverWorker from './serverWorker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

chai.use(chaiHTTP);
const expect = chai.expect;
const request = chai.request;
const { start } = serverWorker;

describe('(Service) serverWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
  });

  describe('which should start a http server', () => {
    let testWorker;

    after(() => {
      testWorker.close();
    });

    it('should return statusinfo', async () => {
      testWorker = start();
      await sleeper(0.5, TIME_UNIT.SECOND).sleep;
      const response = await request(testWorker)
        .get('/index.json');
      expect(response.statusCode).to.eql(200);
      expect(response.body).to.eql({ success: true });
    });
  });
});
