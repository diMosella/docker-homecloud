import chai from 'chai';
import chaiHTTP from 'chai-http';
import { startServer } from './serverWorker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

chai.use(chaiHTTP);
const expect = chai.expect;
const request = chai.request;

describe('(Service) serverWorker', () => {
  it('should be a function', async () => {
    expect(startServer).to.be.a('function');
  });

  describe('which should start a http server', () => {
    it('should return statusinfo', async () => {
      const testWorker = startServer();
      await sleeper(0.5, TIME_UNIT.SECOND).sleep;
      const response = await request(testWorker)
        .get('/index.json');
      expect(response.statusCode).to.eql(200);
      expect(response.body).to.eql({ success: true });
      testWorker.close();
    });
  });
});
