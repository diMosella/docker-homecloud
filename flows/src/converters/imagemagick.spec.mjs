'use strict';

import chai from 'chai';
import sinon from 'sinon';
import imagemagick from './imagemagick.mjs';
import asyncSys from './asyncSys.mjs';

const assert = chai.assert;

describe('(Converter) imagemagick.convert', () => {
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
    assert.typeOf(imagemagick.convert, 'function');
    await assert.throwsAsync(imagemagick.convert, TypeError);
    await assert.throwsAsync(() => imagemagick.convert(context), TypeError);
    await assert.throwsAsync(() => imagemagick.convert(null, next), TypeError);
  });
  describe('which calls', () => {
    const sysCallStub = sinon.fake(async (context, next) => {
      await context.flow.call.onSuccess();
      await next();
    });

    before(() => {
      sinon.replace(asyncSys, 'call', sysCallStub);
    });

    after(() => {
      sinon.restore();
    });

    it('sysCall', async () => {
      await imagemagick.convert(context, next);
      assert.equal(sysCallStub.callCount, 1);
      assert.deepEqual(sysCallStub.firstCall.args[0], context);
      assert.deepEqual(sysCallStub.firstCall.args[1], next);
    });
  });
});
