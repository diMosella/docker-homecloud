'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { tempFolder } from '../basics/config.mjs';

const asyncExec = promisify(execFile);

export const convert = async (context) => {
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A context temp path must be of type string!');
  }

  const { tempPathOrg, derived } = context.flow.file;
  const { nameEdit } = derived;

  const tempPathIntermediate = path.resolve(`${tempFolder}/${nameEdit}.tif`);

  let isError = false;
  await asyncExec('rawtherapee-cli',
      ['-o', `${tempPathIntermediate}`, '-t', '-Y', '-d', '-c', path.resolve(tempPathOrg)]
  ).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });

  if (isError) {
    return;
  }

  context.flow.file.tempPathIntermediate = tempPathIntermediate;
};
