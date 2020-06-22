import chai from 'chai';
import sleeper from './sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;

describe('(Basics) sleeper', () => {
  it('should have a sleep promise', async () => {
    const { sleep } = sleeper(0.1, TIME_UNIT.SECOND);
    expect(sleep).to.be.a('promise');
    const timeout = setTimeout(() => { throw new Error('Timeout reached'); }, 200);
    await sleep;
    clearTimeout(timeout);
  });

  it('should have a interrupt method', async () => {
    const { sleep, interrupt } = sleeper(0.2, TIME_UNIT.SECOND);
    expect(interrupt).to.be.a('function');
    setTimeout(interrupt, 100);
    await sleep.catch((err) => {
      expect(err).to.eql('interrupted');
    });
  });
});
