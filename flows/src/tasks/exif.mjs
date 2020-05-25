'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(execFile);

export const read = async (ctx, next) => {
  await next();
  let isError = false;
  const { stdout, stderr } = await asyncExec('exiftool', ['-j', '../eekhoorn-20190911.jpg']).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });
  // 'Creator': 'SKDD',
  // 'DateTimeOriginal': newTimestamp,
  // 'FileCreateDate': newTimestamp,
  // 'FileModifyDate': newTimestamp
  // console.log('stdout:', JSON.parse(stdout));
  // console.log('stderr:', stderr);
  ctx.flow.fileInfo = isError ? null : JSON.parse(stdout);
}
