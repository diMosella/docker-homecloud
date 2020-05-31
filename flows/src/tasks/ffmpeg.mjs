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

  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

  // let isError = false;
  // const { stdout, stderr } = await asyncExec('convert',
  //     ['-auto-gamma', '-auto-level', '-normalize', path.resolve(tempPathOrg), tempPathEdit]
  // ).catch(error => {
  //   console.log('error:', error);
  //   isError = true;
  //   return error;
  // });
  // context.flow.file.tempPathEdit = tempPathEdit;
};
