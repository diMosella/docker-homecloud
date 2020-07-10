'use strict';

import chai from 'chai';
import Flow from './flow.mjs';


const assert = chai.assert;

describe('(Service) flow', () => {
  const testFlow = new Flow();

  it('should be a class.', () => {
    assert.typeOf(testFlow, 'object');
    assert.instanceOf(testFlow, Flow);
  });

  describe('should have', () => {
    it('public method add', () => {
      assert.typeOf(testFlow.add, 'function');
      assert.throws(testFlow.add, TypeError);
      assert.throws(() => testFlow.add('test'), TypeError);
      const step = testFlow.add((ctx, nxt) => {
        ctx.processed.push(1);
        nxt();
      });
      assert.typeOf(step, 'object');
      assert.instanceOf(step, Flow);
    });
    it('public method go', () => {
      const ctx = { processed: [] };
      assert.typeOf(testFlow.go, 'function');
      testFlow.go(ctx);
      assert.deepEqual(ctx, { processed: [1] });
    });
  });
});
