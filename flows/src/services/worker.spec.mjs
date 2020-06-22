import chai from 'chai';
import worker from './worker.mjs';

const expect = chai.expect;

describe('(Service) worker', () => {
  it('should be a function', () => {
    expect(worker).to.be.a('function');
  });
});
