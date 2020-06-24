'use strict';

const freeze = obj => Object.freeze(obj);
const formatValue = value => value.replace(/(\s|-)/, '_').toUpperCase();

export class Enum {
  #_properties = {};

  constructor () {
    if (this.constructor === Enum) {
      throw new Error('Enum is an abstract class and as such can\'t be instantiated');
    }
  }

  getProperty (item, name) {
    if (typeof item !== 'number' && typeof item !== 'string') {
      throw new TypeError('item should be a number or a string');
    }
    if (typeof name !== 'string') {
      throw new TypeError('name should be a string');
    }
    const affectedItem = typeof item === 'number'
      ? item
      : this[item];
    return this.#_properties[affectedItem] ? this.#_properties[affectedItem][name] : null;
  };

  findBy (field, value) {
    if (typeof field !== 'string') {
      throw new TypeError('field should be a string');
    }
    if (typeof value === 'undefined' || value === null) {
      throw new TypeError('a value is required');
    }
    const candidate = Object.entries(this.#_properties).find((item) => value.toUpperCase() === item[1][field].toUpperCase());
    if (candidate) {
      return Number.parseInt(candidate[0]);
    }
  };

  addItem (item, value, properties) {
    if (typeof item !== 'number') {
      throw new TypeError('item should be a number');
    }
    if (typeof value !== 'string') {
      throw new TypeError('value should be a string');
    }
    if (!(properties instanceof EnumProperties)) {
      throw new TypeError('properties should be EnumProperties');
    }
    this[formatValue(value)] = item;
    this.#_properties[item] = freeze(properties);
  };

  freeze () {
    freeze(this.#_properties);
    return freeze(this);
  }
};

export class EnumProperties {
  // TODO: how to make the fields customizable
  // TODO: how to make typed enums
  /**
   * Creates a frozen EnumProperties instance
   * @param { string } value
   * @param { string | number } label
   * @param { string | number } code
   * @param { number } relativeValue
   */
  constructor (value, label, code, relativeValue) {
    if (typeof value !== 'string') {
      throw new TypeError('value must be a string');
    }
    this.value = formatValue(value);
    this.label = typeof label === 'string' || typeof label === 'number'
      ? label
      : null;
    this.code = typeof code === 'string' || typeof code === 'number'
      ? code
      : null;
    this.relativeValue = typeof relativeValue === 'number'
      ? relativeValue
      : null;
    return freeze(this);
  }
}

/**
 * Create an enumeration out of the provided members.
 * @param {String | EnumProperties} members The members to include in the enum
 */
export const enumerate = (...members) => {
  class ExtendedClass extends Enum {};

  const enumeration = new ExtendedClass();
  for (const member of members) {
    const size = Object.keys(enumeration).length;
    let value = null;
    let props = null;
    if (typeof member === 'string') {
      value = member;
      props = new EnumProperties(value);
    }
    if (member instanceof EnumProperties) {
      value = member.value;
      props = member;
    }
    if (typeof value === 'string' && props instanceof EnumProperties) {
      enumeration.addItem(size, value, props);
    }
  }
  return { class: ExtendedClass, instance: enumeration.freeze() };
};
