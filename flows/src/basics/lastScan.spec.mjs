'use strict';

import chai from 'chai';
import LastScan from './lastScan.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Basics) lastScan', () => {
  const lastScan = new LastScan();

  it('should be a class.', () => {
    expect(lastScan).to.be.a('object');
    expect(lastScan).to.be.an.instanceof(LastScan);
  });

  describe('should have', () => {
    it('public getter', () => {
      expect(lastScan.timestamp).to.eql(0);
    });
    it('public setter', () => {
      assert.throws(() => (lastScan.timestamp = 'a'));
      lastScan.timestamp = 123;
      expect(lastScan.timestamp).to.eql(123);
      lastScan.timestamp = 123456;
      expect(lastScan.timestamp).to.eql(123456);
      assert.throws(() => (lastScan.timestamp = 123));
    });
  });
});
