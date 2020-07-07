'use strict';

import chai from 'chai';
import sinon from 'sinon';
import tesseract from './tesseract.mjs';
import asyncSys from './asyncSys.mjs';

const assert = chai.assert;

describe('(Converter) tesseract.convert', () => {
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
    assert.typeOf(tesseract.convert, 'function');
    await assert.throwsAsync(tesseract.convert, TypeError);
    await assert.throwsAsync(() => tesseract.convert(context), TypeError);
    await assert.throwsAsync(() => tesseract.convert(null, next), TypeError);
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
      await tesseract.convert(context, next);
      assert.equal(sysCallStub.callCount, 1);
      assert.deepEqual(sysCallStub.firstCall.args[0], context);
      assert.deepEqual(sysCallStub.firstCall.args[1], next);
    });
  });
});
