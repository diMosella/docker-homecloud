'use strict';

import { fork } from 'child_process';
import chai from 'chai';
import messenger from './messenger.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;

describe('(Basics) messenger', () => {
  let childProcess;

  after(() => {
    childProcess.kill();
  });
  it('should return a promise', async () => {
    childProcess = fork('src/basics/messenger.spec.sidecar.mjs');
    await sleeper(0.1, TIME_UNIT.SECOND).sleep;
    const transporter = messenger({ type: 'request' }, childProcess);
    expect(transporter).to.be.a('promise');
    const response = await transporter;
    expect(response).to.eql({ type: 'response' });
  });
});
