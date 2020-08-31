'use strict';

import chai from 'chai';
import sinon from 'sinon';
import rawtherapee from './rawtherapee.mjs';
import asyncSys from './asyncSys.mjs';

const assert = chai.assert;

describe('(Converter) rawtherapee.convert', () => {
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
    assert.typeOf(rawtherapee.convert, 'function');
    await assert.throwsAsync(rawtherapee.convert, TypeError);
    await assert.throwsAsync(() => rawtherapee.convert(context), TypeError);
    await assert.throwsAsync(() => rawtherapee.convert(null, next), TypeError);
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
      await rawtherapee.convert(context, next);
      assert.equal(sysCallStub.callCount, 1);
      assert.deepEqual(sysCallStub.firstCall.args[0], context);
      assert.deepEqual(sysCallStub.firstCall.args[1], next);
    });
  });
});
