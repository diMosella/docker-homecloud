'use strict';

import chai from 'chai';
import { cloud } from './credentials.mjs';

const assert = chai.assert;

describe('(Basics) credentials', () => {
  it('should have cloud data.', () => {
    assert.typeOf(cloud, 'object');
    assert.typeOf(cloud.username, 'string');
    assert.typeOf(cloud.password, 'string');
    assert.typeOf(cloud.url, 'string');
  });
});
