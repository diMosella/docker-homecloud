'use strict';

import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import cloud from './cloud.mjs';

const assert = chai.assert;

describe('(Task) cloud', () => {
  describe('should have', () => {
    const context = {
      flow: {
        folder: {
          location: '/test'
        }
      }
    };
    const next = () => { };
    it('a public method getFolderDetails', async () => {
      assert.typeOf(cloud.getFolderDetails, 'function');
      await assert.throwsAsync(cloud.getFolderDetails, TypeError);
      await assert.throwsAsync(() => cloud.getFolderDetails(context), TypeError);
      await assert.throwsAsync(() => cloud.getFolderDetails(null, next), TypeError);
    });
    it('a public method downloadFile', async () => {
      assert.typeOf(cloud.downloadFile, 'function');
      await assert.throwsAsync(cloud.downloadFile, TypeError);
      await assert.throwsAsync(() => cloud.downloadFile(context), TypeError);
      await assert.throwsAsync(() => cloud.downloadFile(null, next), TypeError);
    });
    it('a public method checkForExistence', async () => {
      assert.typeOf(cloud.checkForExistence, 'function');
      await assert.throwsAsync(cloud.checkForExistence, TypeError);
      await assert.throwsAsync(() => cloud.checkForExistence(context), TypeError);
      await assert.throwsAsync(() => cloud.checkForExistence(null, next), TypeError);
    });
    it('a public method ensureFolderHierarchy', async () => {
      assert.typeOf(cloud.ensureFolderHierarchy, 'function');
      await assert.throwsAsync(cloud.ensureFolderHierarchy, TypeError);
      await assert.throwsAsync(() => cloud.ensureFolderHierarchy(context), TypeError);
      await assert.throwsAsync(() => cloud.ensureFolderHierarchy(null, next), TypeError);
    });
    it('a public method moveOriginal', async () => {
      assert.typeOf(cloud.moveOriginal, 'function');
      await assert.throwsAsync(cloud.moveOriginal, TypeError);
      await assert.throwsAsync(() => cloud.moveOriginal(context), TypeError);
      await assert.throwsAsync(() => cloud.moveOriginal(null, next), TypeError);
    });
    it('a public method uploadEdit', async () => {
      context.flow.file = {
        derived: {
          nameEdit: 'test.jpg',
          pathEdit: '/Uploads'
        },
        tempPathEdit: '/home/wim/temp/IMG_0706.JPG'
      };
      assert.typeOf(cloud.uploadEdit, 'function');
      await assert.throwsAsync(cloud.uploadEdit, TypeError);
      await assert.throwsAsync(() => cloud.uploadEdit(context), TypeError);
      await assert.throwsAsync(() => cloud.uploadEdit(null, next), TypeError);
    });
  });
});

//   describe('which calls', () => {
//     const sysCallStub = sinon.fake();

//     before(() => {
//       sinon.replace(asyncSys, 'call', sysCallStub);
//     });

//     after(() => {
//       sinon.restore();
//     });

//     it('sysCall', async () => {
//     });
//   });
// });
