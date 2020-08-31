'use strict';

import chai from 'chai';
import sinon from 'sinon';
import ffmpeg from './ffmpeg.mjs';
import asyncSys from './asyncSys.mjs';

const assert = chai.assert;

describe('(Converter) ffmpeg.convert', () => {
  const context = {
    flow: {
      file: {
        tempPathOrg: '/test',
        derived: {
          nameEdit: 'testEdit'
        }
      }
    }
  };
  const next = () => { };
  it('should be a function', async () => {
    assert.typeOf(ffmpeg.convert, 'function');
    assert.throws(ffmpeg.convert, TypeError);
  });
  describe('creating a step 1 which', () => {
    it('should be a function', async () => {
      assert.typeOf(ffmpeg.convert(1), 'function');
      await assert.throwsAsync(ffmpeg.convert(1), TypeError);
      await assert.throwsAsync(() => ffmpeg.convert(1)(context), TypeError);
      await assert.throwsAsync(() => ffmpeg.convert(1)(null, next), TypeError);
    });
    describe('which calls', () => {
      const sysCallStub = sinon.fake();

      before(() => {
        sinon.replace(asyncSys, 'call', sysCallStub);
      });

      after(() => {
        sinon.restore();
      });

      it('sysCall', async () => {
        await ffmpeg.convert(1)(context, next);
        assert.equal(sysCallStub.callCount, 1);
        assert.deepEqual(sysCallStub.firstCall.args[0], context);
        assert.deepEqual(sysCallStub.firstCall.args[1], next);
      });
    });
  });
  describe('creating a step 2 which', () => {
    it('should be a function', async () => {
      assert.typeOf(ffmpeg.convert(2), 'function');
      await assert.throwsAsync(ffmpeg.convert(2), TypeError);
      await assert.throwsAsync(() => ffmpeg.convert(2)(context), TypeError);
      await assert.throwsAsync(() => ffmpeg.convert(2)(null, next), TypeError);
    });
    describe('which calls', () => {
      const sysCallStub = sinon.fake();

      before(() => {
        sinon.replace(asyncSys, 'call', sysCallStub);
      });

      after(() => {
        sinon.restore();
      });

      it('sysCall', async () => {
        await ffmpeg.convert(2)(context, next);
        assert.equal(sysCallStub.callCount, 1);
        assert.deepEqual(sysCallStub.firstCall.args[0], context);
        assert.deepEqual(sysCallStub.firstCall.args[1], next);
      });
    });
  });
});
