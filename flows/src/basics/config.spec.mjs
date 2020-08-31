'use strict';

import chai from 'chai';
import { watch, tempFolder, basePaths } from './config.mjs';

const assert = chai.assert;

describe('(Basics) config', () => {
  it('should have a watch config.', () => {
    assert.instanceOf(watch, Array);
    for (const watchItem of watch) {
      assert.typeOf(watchItem, 'object');
      assert.typeOf(watchItem.frequency, 'string');
      assert.instanceOf(watchItem.locations, Array);
    }
  });

  it('should have a tempfolder config.', () => {
    assert.typeOf(tempFolder, 'string');
  });

  it('should have a basePaths config.', () => {
    assert.typeOf(basePaths, 'object');
    for (const category of Object.values(basePaths)) {
      assert.typeOf(category, 'object');
      for (const path of Object.values(category)) {
        assert.typeOf(path, 'string');
      }
    }
  });
});
