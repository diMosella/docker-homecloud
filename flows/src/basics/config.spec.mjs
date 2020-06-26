'use strict';

import chai from 'chai';
import { watch, tempFolder, basePaths } from './config.mjs';

const expect = chai.expect;

describe('(Basics) config', () => {
  it('should have a watch config.', () => {
    expect(watch).to.be.a('array');
    for (const watchItem of watch) {
      expect(watchItem).to.be.a('object');
      expect(watchItem.frequency).to.be.a('string');
      expect(watchItem.locations).to.be.an.instanceof(Array);
    }
  });

  it('should have a tempfolder config.', () => {
    expect(tempFolder).to.be.a('string');
  });

  it('should have a basePaths config.', () => {
    expect(basePaths).to.be.a('object');
    for (const category of Object.values(basePaths)) {
      expect(category).to.be.a('object');
      for (const path of Object.values(category)) {
        expect(path).to.be.a('string');
      }
    }
  });
});
