import chai from 'chai';
import { cloud } from './credentials.mjs';

const expect = chai.expect;

describe('(Basics) credentials', () => {
  it('should have cloud data.', () => {
    expect(cloud).to.be.a('object');
    expect(cloud.username).to.be.a('string');
    expect(cloud.password).to.be.a('string');
    expect(cloud.url).to.be.a('string');
  });
});
