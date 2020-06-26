'use strict';

import chai from 'chai';
import sinon from 'sinon';
import { startSolo } from './soloWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;

describe('(Service) startSolo', () => {
  it('should be a function', async () => {
    expect(startSolo).to.be.a('function');
  });

  describe('which should start a solo worker', () => {
    let testWorker;
    const getFolderDetailsStub = sinon.fake(async (context, next) => {
      context.flow.folder.lastModified = Date.now();
      context.flow.folder.details = [];
      return await next();
    });
    sinon.replace(cloud, 'getFolderDetails', getFolderDetailsStub);

    after(() => {
      sinon.restore();
      testWorker.close();
    });

    it('should start', async () => {
      testWorker = startSolo();
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
    });
  });
});
