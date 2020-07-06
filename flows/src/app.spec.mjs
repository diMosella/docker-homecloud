'use strict';

import chai from 'chai';
import sinon from 'sinon';
import cluster from 'cluster';
import app from './app.mjs';
import WorkerManager from './services/workerManager.mjs';
import { WORKER_TYPE } from './basics/constants.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(App) app.start', () => {
  const addStub = sinon.fake((type) => { });
  const getTypeOfStub = sinon.fake((pid) => { });
  const removeStub = sinon.fake((pid) => { });

  before(() => {
    sinon.replace(WorkerManager.prototype, 'add', addStub);
    sinon.replace(WorkerManager.prototype, 'getTypeOf', getTypeOfStub);
    sinon.replace(WorkerManager.prototype, 'remove', removeStub);
  });

  after(() => {
    sinon.restore();
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

  it('should be a function', () => {
    expect(app.start).to.be.a('function');
    app.start();
    assert.equal(addStub.callCount, 2);
    assert.equal(addStub.getCall(0).firstArg, WORKER_TYPE.SOLO);
    assert.equal(addStub.getCall(1).firstArg, WORKER_TYPE.SERVER);
    assert.equal(getTypeOfStub.callCount, 0);
    assert.equal(removeStub.callCount, 0);
  });
});
