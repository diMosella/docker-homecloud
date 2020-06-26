'use strict';

import { fork } from 'child_process';
import chai from 'chai';
import messenger from './messenger.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const expect = chai.expect;

describe('(Basics) messenger', () => {
  let childProcess;

  afterEach(() => {
    childProcess.kill();
  });
  it('should return a promise (to childProcess)', async () => {
    childProcess = fork('src/basics/messenger.spec.sidecar.mjs');
    await sleeper(0.1, TIME_UNIT.SECOND).sleep;
    const transporter = messenger({ type: 'request' }, childProcess);
    expect(transporter).to.be.a('promise');
    const response = await transporter;
    expect(response).to.eql({ type: 'response' });
  });
  it('should be able to reject (to childProcess)', async () => {
    childProcess = fork('src/basics/messenger.spec.sidecar.mjs');
    await sleeper(0.1, TIME_UNIT.SECOND).sleep;
    const transporter = messenger({ type: 'ping' }, childProcess);
    expect(transporter).to.be.a('promise');
    await transporter.catch((err) => {
      expect(err.message).to.eql('no response message');
    });
  });
  it('should return a promise (to same process)', async () => {
    const respond = (msg) => {
      if (msg.type === 'request') {
        process.emit('message', { type: 'echo' });
      }
    };
    process.once('message', respond);
    const transporter = messenger({ type: 'request' });
    expect(transporter).to.be.a('promise');
    const response = await transporter;
    expect(response).to.eql({ type: 'echo' });
  });
  it('should return a promise (from childProcess)', (done) => {
    const toCheck = {
      type: false,
      request: false,
      response: false,
      final: false
    };
    const checkAll = () => {
      if (Object.values(toCheck).every((checker) => checker === true)) {
        done();
      }
    };

    const childProcess = fork('src/basics/messenger.spec.sidecar.mjs', ['--sender']);
    childProcess.on('message', (msg) => {
      switch (msg.type) {
        case 'request':
          childProcess.send({ type: 'response' });
          toCheck.request = true;
          break;
        case 'type':
          expect(msg.value).to.eql('object');
          expect(msg.isPromise).to.eql(true);
          toCheck.type = true;
          break;
        case 'response':
          toCheck.response = true;
          break;
        case 'final':
          toCheck.final = true;
          break;
        default:
          break;
      }
      checkAll();
    });
  });
});
