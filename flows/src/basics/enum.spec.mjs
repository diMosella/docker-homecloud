'use strict';

import chai from 'chai';
import { enumerate, EnumProperties, Enum } from './enum.mjs';

const assert = chai.assert;

describe('(Basics) enum', () => {
  describe('should export enumerate', () => {
    it('which is a function', () => {
      assert.typeOf(enumerate, 'function');
    });
    const { instance: testEnum } = enumerate('first', 'second', 'third');
    it('which returns a frozen object', () => {
      assert.typeOf(testEnum, 'object');
      assert.instanceOf(testEnum, Enum);
      assert.isTrue(Object.isFrozen(testEnum));
    });
    it('which should have a method findBy', () => {
      assert.typeOf(testEnum.findBy, 'function');
      assert.equal(testEnum.findBy('value', 'first'), 0);
      assert.throws(() => testEnum.findBy(null, 'first'), TypeError);
      assert.throws(() => testEnum.findBy('value'), TypeError);
    });
  });

  describe('should export EnumProperties', () => {
    const testEnumProps = new EnumProperties('value', 'label', 'code', 10);
    it('which is a class', () => {
      assert.typeOf(testEnumProps, 'object');
      assert.instanceOf(testEnumProps, EnumProperties);
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
      assert.typeOf(testEnum, 'object');
      assert.instanceOf(testEnum, Enum);
      assert.instanceOf(testEnum, ExtendedEnum);
    });
    it('which should have a method addItem', () => {
      assert.typeOf(testEnum.addItem, 'function');
      assert.throws(testEnum.addItem, TypeError);
      assert.throws(() => testEnum.addItem(0), TypeError);
      assert.throws(() => testEnum.addItem(0, 'test_Item'), TypeError);
      const enumProps = new EnumProperties('test_Item', 'TestLabel', 'TestCode', 2);
      testEnum.addItem(0, 'test_Item', enumProps);
    });
    it('which should have a method freeze', () => {
      assert.typeOf(testEnum.freeze, 'function');
      testEnum.freeze();
      assert.isTrue(Object.isFrozen(testEnum));
    });
    it('which should have a method getProperty', () => {
      assert.typeOf(testEnum.getProperty, 'function');
      assert.throws(testEnum.getProperty, TypeError);
      assert.throws(() => testEnum.getProperty(0), TypeError);
      assert.equal(testEnum.getProperty(0, 'code'), 'TestCode');
      assert.equal(testEnum.getProperty('TEST_ITEM', 'label'), 'TestLabel');
      assert.isNull(testEnum.getProperty('ITEM', 'label'));
    });
  });
});
