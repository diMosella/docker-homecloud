'use strict';

import chai from 'chai';
import sinon from 'sinon';
import Log from './log.mjs';
import { LOG_LEVEL } from '../basics/constants.mjs';

const assert = chai.assert;

const deleteLog = () => {
  if (Log.instance) {
    delete Log.instance;
  }
};

describe('(Service) log', () => {
  const errorStub = sinon.fake(function errorStub (msg) { });
  const warnStub = sinon.fake(function warnStub (msg) { });
  const infoStub = sinon.fake(function infoStub (msg) { });
  const debugStub = sinon.fake(function debugStub (msg) { });

  const stubs = [errorStub, warnStub, infoStub, debugStub];
  const levels = Object.values(LOG_LEVEL);

  const resetHistory = () => {
    errorStub.resetHistory();
    warnStub.resetHistory();
    infoStub.resetHistory();
    debugStub.resetHistory();
  };

  before(() => {
    sinon.replace(console, 'error', errorStub);
    sinon.replace(console, 'warn', warnStub);
    sinon.replace(console, 'info', infoStub);
    sinon.replace(console, 'debug', debugStub);
  });

  after(() => {
    sinon.restore();
  });

  beforeEach(() => {
    deleteLog();
  });

  describe('in general', () => {
    it('should be a class.', () => {
      assert.throws(() => new Log('test'), TypeError);
      const testLog1 = new Log(LOG_LEVEL.ERROR);
      assert.typeOf(testLog1, 'object');
      assert.instanceOf(testLog1, Log);
      assert.throws(() => new Log(LOG_LEVEL.INFO), Error);
      deleteLog();
      const testLog2 = new Log(LOG_LEVEL.WARN);
      assert.typeOf(testLog2, 'object');
      assert.instanceOf(testLog2, Log);
      deleteLog();
      delete process.env.LOG_LEVEL;
      const testLog3 = new Log();
      assert.typeOf(testLog3, 'object');
      assert.instanceOf(testLog3, Log);
      deleteLog();
      process.env.LOG_LEVEL = 'debug';
      const testLog4 = new Log();
      assert.typeOf(testLog4, 'object');
      assert.instanceOf(testLog4, Log);
    });
  });

  for (const level of levels) {
    describe(`in level ${LOG_LEVEL.getProperty(level, 'label')}`, () => {
      let testLog;

      it('should be a class.', () => {
        testLog = new Log(level);
        assert.typeOf(testLog, 'object');
        assert.instanceOf(testLog, Log);
      });

      describe('should have', () => {
        afterEach(() => {
          resetHistory();
        });

        for (const item of levels) {
          const methodLabel = LOG_LEVEL.getProperty(item, 'label');

          it(`public method ${methodLabel}`, () => {
            assert.typeOf(testLog[methodLabel], 'function');
            testLog[methodLabel](`${methodLabel}${level}`);
            for (let stubIndex = 0; stubIndex++; stubIndex < stubs.length) {
              const expectedCallCount = (stubIndex <= level && stubIndex === item) ? 1 : 0;
              assert.equal(
                stubs[stubIndex].callCount,
                expectedCallCount,
                `expected log.${methodLabel} to trigger ${stubs[stubIndex].name} ${expectedCallCount} times but was ${stubs[stubIndex].callCount}`
              );
              if (expectedCallCount > 0) {
                const results = stubs[stubIndex].getCall(0).args
                  .map((arg) => arg.endsWith(`- ${methodLabel}: ${methodLabel}${level}`));
                assert.deepEqual(results, [true]);
              }
            };
          });
        }
      });
    });
  }
});
