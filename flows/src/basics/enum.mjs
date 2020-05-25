'use strict';

const freeze = obj => Object.freeze(obj);

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
  constructor(value, label, code, relativeValue) {
    this.value = typeof value === 'string'
      ? value.toUpperCase()
      : null;
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
  const properties= {};
  for (const member of members) {
    const size = Object.keys(enumeration).length;
    let value = null;
    let props = null;
    if(typeof member === 'string') {
      value = member.toUpperCase();
      props = new EnumProperties(value);
    }
    if (member instanceof EnumProperties) {
      value = member.value;
      props = member;
    }
    if (typeof value === 'string' && props instanceof EnumProperties) {
      enumeration[value] = size;
      properties[size] = freeze(props);
    }
  }
  enumeration.properties = freeze(properties);
  return freeze(enumeration);
};
