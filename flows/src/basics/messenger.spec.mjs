import { fork } from 'child_process';
import chai from 'chai';

const expect = chai.expect;

describe('(Basics) messenger', () => {
  it('should return a promise', (done) => {
    const toCheck = {
      type: false,
      request: false,
      response: false,
      final: false
    };
    const checkAll = () => {
      if (Object.values(toCheck).every((checker) => checker === true)) {
        done();
        childProcess.kill();
      }
    };

    const childProcess = fork('src/basics/messenger.spec.sidecar.mjs');
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
