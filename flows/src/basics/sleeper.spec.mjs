'use strict';

import chai from 'chai';
import sleeper from './sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const assert = chai.assert;

describe('(Basics) sleeper', () => {
  it('should have a sleep promise', async () => {
    const { sleep } = sleeper(0.1, TIME_UNIT.SECOND);
    assert.typeOf(sleep, 'promise');
    const timeout = setTimeout(() => { throw new Error('Timeout reached'); }, 200);
    await sleep;
    clearTimeout(timeout);
  });

  it('should have a interrupt method', async () => {
    const { sleep, interrupt } = sleeper(0.2, TIME_UNIT.SECOND);
    assert.typeOf(interrupt, 'function');
    setTimeout(interrupt, 100);
    await sleep.catch((error) => {
      assert.equal(error, 'interrupted');
    });
  });
});
