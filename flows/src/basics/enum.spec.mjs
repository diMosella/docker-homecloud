'use strict';

import chai from 'chai';
import { enumerate, EnumProperties, Enum } from './enum.mjs';

const expect = chai.expect;
const assert = chai.assert;

describe('(Basics) enum', () => {
  describe('should export enumerate', () => {
    it('which is a function', () => {
      expect(enumerate).to.be.a('function');
    });
    const { instance: testEnum } = enumerate('first', 'second', 'third');
    it('which returns a frozen object', () => {
      expect(testEnum).to.be.a('object');
      expect(testEnum).to.be.an.instanceof(Enum);
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

  describe('should export Enum', () => {
    it('which is an abstract class', () => {
      assert.throws(() => new Enum());
    });
    class ExtendedEnum extends Enum {};
    const testEnum = new ExtendedEnum();
    it('which can be extended class', () => {
      expect(testEnum).to.be.a('object');
      expect(testEnum).to.be.an.instanceof(Enum);
      expect(testEnum).to.be.an.instanceof(ExtendedEnum);
    });
    it('which should have a method addItem', () => {
      expect(testEnum.addItem).to.be.a('function');
      assert.throws(testEnum.addItem, TypeError);
      assert.throws(() => testEnum.addItem(0), TypeError);
      assert.throws(() => testEnum.addItem(0, 'test_Item'), TypeError);
      const enumProps = new EnumProperties('test_Item', 'TestLabel', 'TestCode', 2);
      testEnum.addItem(0, 'test_Item', enumProps);
    });
    it('which should have a method freeze', () => {
      expect(testEnum.freeze).to.be.a('function');
      testEnum.freeze();
      expect(Object.isFrozen(testEnum)).to.eql(true);
    });
    it('which should have a method getProperty', () => {
      expect(testEnum.getProperty).to.be.a('function');
      assert.throws(testEnum.getProperty, TypeError);
      assert.throws(() => testEnum.getProperty(0), TypeError);
      expect(testEnum.getProperty(0, 'code')).to.eql('TestCode');
      expect(testEnum.getProperty('TEST_ITEM', 'label')).to.eql('TestLabel');
      expect(testEnum.getProperty('ITEM', 'label')).to.eql(null);
    });
  });
});
