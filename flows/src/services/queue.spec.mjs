'use strict';

import chai from 'chai';
import sinon from 'sinon';
import Queue from './queue.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT, STATE } from '../basics/constants.mjs';

const assert = chai.assert;

describe('(Service) queue', () => {
  const callbackStub = sinon.fake((msg) => { });
  const testQueue = new Queue(callbackStub, 0.1);

  it('should be a class.', () => {
    assert.typeOf(testQueue, 'object');
    assert.instanceOf(testQueue, Queue);
  });

  describe('should have', () => {
    it('public method push', async () => {
      assert.typeOf(testQueue.push, 'function');
      await testQueue.push({ test: true });
      await testQueue.push({ test: true, isSecond: true });
      await sleeper(0.2, TIME_UNIT.SECOND).sleep;
      assert.equal(callbackStub.callCount, 1);
    });

    let nextVal;
    it('public method next', () => {
      assert.typeOf(testQueue.next, 'function');
      nextVal = testQueue.next();
      assert.deepEqual(nextVal, {
        done: false,
        value: {
          queueId: 0,
          state: STATE.QUEUED,
          test: true
        }
      });
      testQueue.next();
      testQueue.next();
      assert.deepEqual(testQueue.next(), {
        done: true,
        value: undefined
      });
    });

    it('public method lock', async () => {
      assert.typeOf(testQueue.lock, 'function');
      assert.throws(testQueue.lock, TypeError);
      testQueue.lock(nextVal.value.queueId);
    });

    it('public method finish', async () => {
      assert.typeOf(testQueue.finish, 'function');
      assert.throws(testQueue.finish, TypeError);
      testQueue.finish(nextVal.value.queueId);
    });

    it('public method reset', async () => {
      assert.typeOf(testQueue.reset, 'function');
      testQueue.reset();
    });
  });
});
