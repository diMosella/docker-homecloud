'use strict';

import chai from 'chai';
import { startSolo } from './soloWorker.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;

describe('(Service) startSolo', () => {
  it('should be a function', async () => {
    expect(startSolo).to.be.a('function');
  });

  describe('which should start a solo worker', () => {
    let testWorker;

    after(() => {
      // testWorker.close();
    });

    it('should start', async () => {
      testWorker = startSolo();
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
    });
  });
});
