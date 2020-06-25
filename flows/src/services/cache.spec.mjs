'use strict';

import chai from 'chai';
import Cache from './cache.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Service) cache', () => {
  const testCache = new Cache();

  it('should be a class.', () => {
    expect(testCache).to.be.a('object');
    expect(testCache).to.be.an.instanceof(Cache);
  });

  describe('should have', () => {
    it('public getter', () => {
      expect(testCache.get).to.be.a('object');
      expect(testCache.get).to.eql({});
    });
    it('public method set', () => {
      expect(testCache.set).to.be.a('function');
      assert.throws(testCache.set, TypeError);
      testCache.set('/arbitrairy/path/to/cache', false);
      expect(testCache.get).to.eql({ arbitrairy: { path: { to: { cache: false } } } });
      testCache.set('/arbitrairy/path/to/cache', true);
      expect(testCache.get).to.eql({ arbitrairy: { path: { to: { cache: true } } } });
      testCache.set('/arbitrairy/path/1/another', false);
      expect(testCache.get).to.eql({ arbitrairy: { path: { to: { cache: true }, 1: { another: false } } } });
    });
    it('public method getByPath', () => {
      expect(testCache.getByPath).to.be.a('function');
      assert.throws(testCache.getByPath, TypeError);
      expect(testCache.getByPath('arbitrairy/path/1')).to.eql({ another: false });
    });
    it('public method listen', async () => {
      expect(testCache.listen).to.be.a('function');
      assert.throws(testCache.listen, TypeError);
      const setValue = () => {
        testCache.set('/arbitrairy/path/1/another', true);
        return Promise.resolve('value is set');
      };
      const listening = testCache.listen('arbitrairy/path/1/another');
      expect(listening).to.be.a('promise');
      const result = await Promise.all([listening, setValue()]);
      expect(result).to.eql([true, 'value is set']);
    });
  });
});
