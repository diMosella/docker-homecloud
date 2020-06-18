import chai from 'chai';
import Cache from './cache.mjs';

const expect = chai.expect;

describe('(Service) cache', () => {
  const testCache = new Cache();

  it('should be a class.', (done) => {
    expect(testCache).to.be.a('object');
    expect(testCache).to.be.an.instanceof(Cache);
    done();
  });

  describe('should have', (done) => {
    it('public getter', (done) => {
      expect(testCache.get).to.be.a('object');
      expect(testCache.get).to.eql({});
      done();
    });
    it('public method set', (done) => {
      expect(testCache.set).to.be.a('function');
      testCache.set('/arbitrairy/path/to/cache', false);
      expect(testCache.get).to.eql({ arbitrairy: { path: { to: { cache: false } } } });
      testCache.set('/arbitrairy/path/to/cache', true);
      expect(testCache.get).to.eql({ arbitrairy: { path: { to: { cache: true } } } });
      testCache.set('/arbitrairy/path/1/another', false);
      expect(testCache.get).to.eql({ arbitrairy: { path: { to: { cache: true }, 1: { another: false } } } });
      done();
    });
    it('public method getByPath', (done) => {
      expect(testCache.getByPath).to.be.a('function');
      done();
    });
  });
});
