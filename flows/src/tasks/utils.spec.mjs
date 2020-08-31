'use strict';

// import path from 'path';
import chai from 'chai';
// import sinon from 'sinon';
import utils from './utils.mjs';

const assert = chai.assert;

describe('(Task) utils', () => {
  describe('should have', () => {
    // const checkConnectivityStub = sinon.fake(() => Promise.resolve(true));
    // const getFolderFileDetailsStub = sinon.fake(() => Promise.resolve());

    // before(() => {
    // });

    // after(() => {
    //   sinon.restore();
    // });

    const context = {
      flow: {
        folder: {
          location: '/test',
          details: [{ name: 'test.jpg' }]
        },
        file: {
          details: {
            name: 'test.jpeg',
            lastModified: '20200301T12:23:45'
          },
          exif: {
            DateTimeOriginal: '2020:01:01',
            FileCreationDate: '2020:02:01',
            FileTypeExtension: 'jpg'
          },
          folder: '/Uploads/Sony'
        }
      }
    };
    const lastScan = { timestamp: Date.now() };
    const next = () => { };
    it('a public method checkForChanges', async () => {
      assert.typeOf(utils.checkForChanges(lastScan), 'function');
      await assert.throwsAsync(utils.checkForChanges(lastScan), TypeError);
      await assert.throwsAsync(() => utils.checkForChanges(lastScan)(context), TypeError);
      await assert.throwsAsync(() => utils.checkForChanges(lastScan)(null, next), TypeError);
      await utils.checkForChanges(lastScan)(context, next);
    });
    it('a public method deriveInfo', async () => {
      assert.typeOf(utils.deriveInfo, 'function');
      await assert.throwsAsync(utils.deriveInfo, TypeError);
      await assert.throwsAsync(() => utils.deriveInfo(context), TypeError);
      await assert.throwsAsync(() => utils.deriveInfo(null, next), TypeError);
      await utils.deriveInfo(context, next);
    });
    it('a public method convert', async () => {
      assert.typeOf(utils.convert, 'function');
      await assert.throwsAsync(utils.convert, TypeError);
      await assert.throwsAsync(() => utils.convert(context), TypeError);
      await assert.throwsAsync(() => utils.convert(null, next), TypeError);
    });
    it('a public method cleanTempFolder', async () => {
      assert.typeOf(utils.cleanTempFolder, 'function');
      await assert.throwsAsync(utils.cleanTempFolder, TypeError);
      await assert.throwsAsync(() => utils.cleanTempFolder(context), TypeError);
      await assert.throwsAsync(() => utils.cleanTempFolder(null, next), TypeError);
    });
  });
});
