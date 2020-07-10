'use strict';

import chai from 'chai';
import sinon from 'sinon';
import Sequencer from './sequencer.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';


const assert = chai.assert;

describe('(Service) sequencer', () => {
  const testSequencer = new Sequencer();

  it('should be a class.', () => {
    assert.typeOf(testSequencer, 'object');
    assert.instanceOf(testSequencer, Sequencer);
  });

  describe('should have', () => {
    it('public method start', () => {
      assert.typeOf(testSequencer.start, 'function');
      assert.typeOf(testSequencer.start(), 'promise');
    });
    it('public method done', () => {
      assert.typeOf(testSequencer.done, 'function');
      assert.typeOf(testSequencer.done(), 'undefined');
    });
  });

  describe('should sequence steps', () => {
    const count = 3;

    after(() => {
      sinon.restore();
    });

    it('and fails without', () => {
      const withoutStub = sinon.fake();
      for (let listenIndex = 0; listenIndex < count; listenIndex++) {
        process.once('message', (_msg) => {
          process.once('message', (emitIndex) => withoutStub({ listenIndex, emitIndex }));
        });
      }
      process.emit('message', 'start');

      for (let emitIndex = 0; emitIndex < count; emitIndex++) {
        process.emit('message', emitIndex);
      }
      assert.ok(withoutStub.callCount === 3);
      assert.strictEqual(withoutStub.getCall(0).firstArg.listenIndex, 0);
      assert.strictEqual(withoutStub.getCall(0).firstArg.emitIndex, 0);
      assert.strictEqual(withoutStub.getCall(1).firstArg.listenIndex, 1);
      assert.strictEqual(withoutStub.getCall(1).firstArg.emitIndex, 0);
      assert.strictEqual(withoutStub.getCall(2).firstArg.listenIndex, 2);
      assert.strictEqual(withoutStub.getCall(2).firstArg.emitIndex, 0);
    });

    it('succeeds with', async () => {
      const withStub = sinon.fake();
      for (let listenIndex = 0; listenIndex < count; listenIndex++) {
        process.once('message', async (_msg) => {
          await testSequencer.start();
          process.once('message', (emitIndex) => {
            withStub({ listenIndex, emitIndex });
            testSequencer.done();
          });
        });
      }
      process.emit('message', 'start');

      await sleeper(0.05, TIME_UNIT.SECOND).sleep;
      for (let emitIndex = 0; emitIndex < count; emitIndex++) {
        process.emit('message', emitIndex);
        await sleeper(0.05, TIME_UNIT.SECOND).sleep;
      }

      assert.equal(withStub.callCount, 3);
      assert.strictEqual(withStub.getCall(0).firstArg.listenIndex, 0);
      assert.strictEqual(withStub.getCall(0).firstArg.emitIndex, 0);
      assert.strictEqual(withStub.getCall(1).firstArg.listenIndex, 1);
      assert.strictEqual(withStub.getCall(1).firstArg.emitIndex, 1);
      assert.strictEqual(withStub.getCall(2).firstArg.listenIndex, 2);
      assert.strictEqual(withStub.getCall(2).firstArg.emitIndex, 2);
    });
  });
});
