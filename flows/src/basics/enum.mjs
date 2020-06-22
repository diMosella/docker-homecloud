'use strict';

const freeze = obj => Object.freeze(obj);
const formatValue = value => value.replace(/(\s|-)/, '_').toUpperCase();
const findBy = (obj) => (field, value) => {
  if (typeof field !== 'string') {
    throw new TypeError('field should be a string');
  }
  if (typeof value === 'undefined' || value === null) {
    throw new TypeError('a value is required');
  }
  const candidate = Object.entries(obj).find((item) => value.toUpperCase() === item[1][field].toUpperCase());
  if (candidate) {
    return Number.parseInt(candidate[0]);
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
  const enumeration = {};
  const properties = {};
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
      enumeration[formatValue(value)] = size;
      properties[size] = freeze(props);
    }
  }
  enumeration.properties = freeze(properties);
  enumeration.findBy = findBy(enumeration.properties);
  return freeze(enumeration);
};
