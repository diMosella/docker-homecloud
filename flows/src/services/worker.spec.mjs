import chai from 'chai';
import worker from './worker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;

describe('(Service) worker', () => {
  it('should be a function', async () => {
    expect(worker).to.be.a('function');
    const testWorker = worker(1, 1);
    await sleeper(1, TIME_UNIT.SECOND).sleep;
    testWorker.close();
  });
});
