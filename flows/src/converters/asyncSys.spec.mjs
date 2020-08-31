'use strict';

import chai from 'chai';
import sinon from 'sinon';
import asyncSys from './asyncSys.mjs';

const assert = chai.assert;

describe('(Converter) asyncSys.call', () => {
  const onFailureStub = sinon.fake();
  const errorStub = sinon.fake();

  after(() => {
    sinon.restore();
  });
  const context = {
    flow: {
      file: {
        tempPathOrg: '/test'
      },
      call: {
        onSuccess: 1,
        onFailure: 1
      }
    }
  };
  const next = () => { };
  it('should be a function', async () => {
    assert.typeOf(asyncSys.call, 'function');
    await assert.throwsAsync(asyncSys.call, TypeError);
    await assert.throwsAsync(() => asyncSys.call(context), TypeError);
    await assert.throwsAsync(() => asyncSys.call(null, next), TypeError);
    await assert.throwsAsync(() => asyncSys.call(context, next), TypeError);
    context.flow.call.exec = 'mochaTest';
    await assert.throwsAsync(() => asyncSys.call(context, next), TypeError);
    context.flow.call.options = [];
    await assert.throwsAsync(() => asyncSys.call(context, next), TypeError);
    delete context.flow.call.onSuccess;
    await assert.throwsAsync(() => asyncSys.call(context, next), TypeError);
    context.flow.call.onFailure = onFailureStub;
    await asyncSys.call(context, next).catch(errorStub);
    assert.equal(onFailureStub.callCount, 1);
    assert.equal(errorStub.callCount, 1);
  });
});
