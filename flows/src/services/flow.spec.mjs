'use strict';

import chai from 'chai';
import Flow from './flow.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Service) flow', () => {
  const testFlow = new Flow();

  it('should be a class.', () => {
    expect(testFlow).to.be.a('object');
    expect(testFlow).to.be.an.instanceof(Flow);
  });

  describe('should have', () => {
    it('public method add', () => {
      expect(testFlow.add).to.be.a('function');
      assert.throws(testFlow.add, TypeError);
      assert.throws(() => testFlow.add('test'), TypeError);
      const step = testFlow.add((ctx, nxt) => {
        ctx.processed.push(1);
        nxt();
      });
      expect(step).to.be.a('object');
      expect(step).to.be.an.instanceof(Flow);
    });
    it('public method go', () => {
      const ctx = { processed: [] };
      expect(testFlow.go).to.be.a('function');
      testFlow.go(ctx);
      expect(ctx).to.eql({ processed: [1] });
    });
  });
});
