'use strict';

import { fork } from 'child_process';
import chai from 'chai';
import messenger from './messenger.mjs';
import sleeper from '../basics/sleeper.mjs';
import { TIME_UNIT } from '../basics/constants.mjs';

const assert = chai.assert;

describe('(Basics) messenger', () => {
  let childProcess;

  afterEach(() => {
    childProcess.kill();
  });
  it('should return a promise (to childProcess)', async () => {
    childProcess = fork('src/basics/messenger.spec.sidecar.mjs');
    await sleeper(0.15, TIME_UNIT.SECOND).sleep;
    const transporter = messenger({ type: 'request' }, childProcess);
    assert.typeOf(transporter, 'promise');
    const response = await transporter;
    assert.deepEqual(response, { type: 'response' });
  });
  it('should be able to reject (to childProcess)', async () => {
    childProcess = fork('src/basics/messenger.spec.sidecar.mjs');
    await sleeper(0.15, TIME_UNIT.SECOND).sleep;
    const transporter = messenger({ type: 'ping' }, childProcess);
    assert.typeOf(transporter, 'promise');
    await transporter.catch((error) => {
      assert.equal(error.message, 'no response message');
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
    assert.typeOf(transporter, 'promise');
    const response = await transporter;
    assert.deepEqual(response, { type: 'echo' });
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
          assert.equal(msg.value, 'object');
          assert.isTrue(msg.isPromise);
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
