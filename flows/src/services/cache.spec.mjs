'use strict';

import chai from 'chai';
import Cache from './cache.mjs';

const assert = chai.assert;

describe('(Service) cache', () => {
  const testCache = new Cache();

  it('should be a class.', () => {
    assert.typeOf(testCache, 'object');
    assert.instanceOf(testCache, Cache);
  });

  describe('should have', () => {
    it('public getter', () => {
      assert.typeOf(testCache.all, 'object');
      assert.isEmpty(testCache.all);
    });
    it('public method set', () => {
      assert.typeOf(testCache.set, 'function');
      assert.throws(testCache.set, TypeError);
      testCache.set('/arbitrairy/path/to/cache', false);
      assert.deepEqual(testCache.all, { arbitrairy: { path: { to: { cache: false } } } });
      testCache.set('/arbitrairy/path/to/cache', true);
      assert.deepEqual(testCache.all, { arbitrairy: { path: { to: { cache: true } } } });
      testCache.set('/arbitrairy/path/1/another', false);
      assert.deepEqual(testCache.all, {
        arbitrairy: {
          path: {
            to: { cache: true },
            1: { another: false }
          }
        }
      });
    });
    it('public method getByPath', () => {
      assert.typeOf(testCache.getByPath, 'function');
      assert.throws(testCache.getByPath, TypeError);
      assert.deepEqual(testCache.getByPath('arbitrairy/path/1'), { another: false });
    });
    it('public method listen', async () => {
      assert.typeOf(testCache.listen, 'function');
      await assert.throwsAsync(testCache.listen, TypeError);
      const setValue = () => {
        testCache.set('/arbitrairy/path/1/another', true);
        return Promise.resolve('value is set');
      };
      const listening = testCache.listen('arbitrairy/path/1/another');
      assert.typeOf(listening, 'promise');
      const result = await Promise.all([listening, setValue()]);
      assert.deepEqual(result, [true, 'value is set']);
    });
  });
});
