'use strict';

import chai from 'chai';
import sinon from 'sinon';
import Queue from './queue.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT, STATE } from '../basics/constants.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Service) queue', () => {
  const callbackStub = sinon.fake((msg) => { });
  const testQueue = new Queue(callbackStub, 0.1);

  it('should be a class.', () => {
    expect(testQueue).to.be.a('object');
    expect(testQueue).to.be.an.instanceof(Queue);
  });

  describe('should have', () => {
    it('public method push', async () => {
      expect(testQueue.push).to.be.a('function');
      testQueue.push({ test: true });
      await sleeper(0.2, TIME_UNIT.SECOND).sleep;
      assert.ok(callbackStub.calledOnce);
    });

    let nextVal;
    it('public method next', () => {
      expect(testQueue.next).to.be.a('function');
      nextVal = testQueue.next();
      expect(nextVal).to.eql({
        done: false,
        value: {
          queueId: 0,
          state: STATE.QUEUED,
          test: true
        }
      });
      expect(testQueue.next()).to.eql({
        done: true,
        value: undefined
      });
    });

    it('public method lock', async () => {
      expect(testQueue.lock).to.be.a('function');
      assert.throws(testQueue.lock, TypeError);
      testQueue.lock(nextVal.value.queueId);
    });

    it('public method finish', async () => {
      expect(testQueue.finish).to.be.a('function');
      assert.throws(testQueue.finish, TypeError);
      testQueue.finish(nextVal.value.queueId);
    });

    it('public method reset', async () => {
      expect(testQueue.reset).to.be.a('function');
      testQueue.reset();
    });
  });
});
