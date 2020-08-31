'use strict';

import chai from 'chai';
import sinon from 'sinon';
import exif from './exif.mjs';
import asyncSys from './asyncSys.mjs';

const assert = chai.assert;

describe('(Converter) exif.extract', () => {
  const context = {
    flow: {
      file: {
        tempPathOrg: '/test'
      }
    }
  };
  const next = () => { };
  it('should be a function', async () => {
    assert.typeOf(exif.extract, 'function');
    await assert.throwsAsync(exif.extract, TypeError);
    await assert.throwsAsync(() => exif.extract(context), TypeError);
    await assert.throwsAsync(() => exif.extract(null, next), TypeError);
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
      await exif.extract(context, next);
      assert.equal(sysCallStub.callCount, 1);
      assert.deepEqual(sysCallStub.firstCall.args[0], context);
      assert.deepEqual(sysCallStub.firstCall.args[1], next);
    });
  });
});
