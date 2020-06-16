'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { tempFolder } from '../basics/config.mjs';

const asyncExec = promisify(execFile);

export const convert = async (context) => {
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A context temp path must be of type string!');
  }

  const { tempPathOrg, tempPathIntermediate, derived } = context.flow.file;
  const { nameEdit, editExtension } = derived;

  const isPDF = editExtension === 'pdf';

  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}${isPDF ? '.tif' : ''}`);
  const original = tempPathIntermediate || tempPathOrg;
  const options = isPDF
    ? [ '-density', '200', '-resize', '2490x3510' ]
    : ['-auto-gamma', '-auto-level', '-normalize'];

  let isError = false;
  await asyncExec('convert',
      [path.resolve(original), ...options, tempPathEdit]
  ).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });

  if (tempPathIntermediate) {
    fs.unlink(path.resolve(tempPathIntermediate), (err) => {
      if (err) throw err;
    });
  }

  if (isError) {
    return;
  }

  context.flow.file[isPDF ? 'tempPathIntermediate' : 'tempPathEdit'] = tempPathEdit;
};

// Set -define dng:use-camera-wb=true to use the RAW-embedded color profile for Sony cameras. You can also set these options: use-auto-wb, use-auto-bright, and output-color
// magick /home/wim/temp/DSC09670.ARW -define "dng:use-camera-wb=true dng:use-auto-bright=true" -auto-gamma -auto-level -normalize /home/wim/temp/jpg/DSC09670-im.jpg
