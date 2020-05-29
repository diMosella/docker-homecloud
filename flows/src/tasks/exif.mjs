'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const asyncExec = promisify(execFile);
const asyncExec1 = promisify(execFile);

export const read = async (ctx, next) => {
  await next();
  let isError = false;
  const { stdout, stderr } = await asyncExec('exiftool', ['-j', '-a', path.resolve('../DSC09550.arw')]).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });
  // console.log(stdout);
  ctx.flow.fileInfo = isError ? null : JSON.parse(stdout);
  const { stdout: stdout1, stderr: stderr1 } = await asyncExec1('exiftool', ['-FileModifyDate<DateTimeOriginal', '-CreationDate<DateTimeOriginal', path.resolve('../IMG_0705.jpg')]).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });

  // 'Creator': 'SKDD',
  // 'DateTimeOriginal': newTimestamp,
  // 'FileCreateDate': newTimestamp,
  // 'FileModifyDate': newTimestamp
  // ctx.flow.fileInfo = isError ? null : JSON.parse(stdout);
};
