'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const asyncExec = promisify(execFile);

export const extractExif = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A context temp path must be of type string!');
  }

  let isError = false;
  const { stdout, stderr } = await asyncExec('exiftool', ['-j', '-a', path.resolve(context.flow.file.tempPathOrg)]).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });
  context.flow.file.exif = isError ? null : JSON.parse(stdout)[0];
  return await next();
};
