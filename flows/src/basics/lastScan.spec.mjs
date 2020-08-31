'use strict';

import chai from 'chai';
import LastScan from './lastScan.mjs';

const assert = chai.assert;

describe('(Basics) lastScan', () => {
  const lastScan = new LastScan();

  it('should be a class.', () => {
    assert.typeOf(lastScan, 'object');
    assert.instanceOf(lastScan, LastScan);
  });

  describe('should have', () => {
    it('public getter', () => {
      assert.equal(lastScan.timestamp, 0);
    });
    it('public setter', () => {
      assert.throws(() => (lastScan.timestamp = 'a'));
      lastScan.timestamp = 123;
      assert.equal(lastScan.timestamp, 123);
      lastScan.timestamp = 123456;
      assert.equal(lastScan.timestamp, 123456);
      assert.throws(() => (lastScan.timestamp = 123));
    });
  });
});
