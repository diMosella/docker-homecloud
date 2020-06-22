import chai from 'chai';
import { enumerate, EnumProperties } from './enum.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Basics) enum', () => {
  describe('should export enumerate', () => {
    it('which is a function', () => {
      expect(enumerate).to.be.a('function');
    });
    const testEnum = enumerate('first', 'second', 'third');
    it('which returns a frozen object', () => {
      expect(testEnum).to.be.a('object');
      expect(Object.isFrozen(testEnum)).to.eql(true);
    });
    it('which should have a method findBy', () => {
      expect(testEnum.findBy).to.be.a('function');
      expect(testEnum.findBy('value', 'first')).to.eql(0);
      assert.throws(() => testEnum.findBy(null, 'first'), TypeError);
      assert.throws(() => testEnum.findBy('value'), TypeError);
    });
  });

  describe('should export EnumProperties', () => {
    const testEnumProps = new EnumProperties('value', 'label', 'code', 10);
    it('which is a class', () => {
      expect(testEnumProps).to.be.a('object');
      expect(testEnumProps).to.be.an.instanceof(EnumProperties);
    });
    it('which should throw error when value not properly set', () => {
      const createEnumProps = () => new EnumProperties(null, 'label');
      assert.throws(createEnumProps, TypeError, 'value must be a string');
    });
  });
});
