'use strict';

import chai from 'chai';
import sinon from 'sinon';

process.env.NODE_ENV = 'test';

chai.assert.throwsAsync = async (func, type) => {
  const errorStub = sinon.fake();
  await func().catch(errorStub);
  chai.assert.equal(errorStub.callCount, 1,
    'expected an error to be thrown once');
  chai.assert.isTrue(errorStub.firstCall.args[0] instanceof type,
    `expected ${type.name}, but got ${errorStub.firstCall.args[0].name}`);
};
