'use strict';

import chai from 'chai';
import sinon from 'sinon';
import soloWorker from './soloWorker.mjs';
import cloud from '../tasks/cloud.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;
const { start } = soloWorker;

describe('(Service) soloWorker.start', () => {
  it('should be a function', async () => {
    expect(start).to.be.a('function');
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
      testWorker = start();
      await sleeper(0.1, TIME_UNIT.SECOND).sleep;
    });
  });
});
