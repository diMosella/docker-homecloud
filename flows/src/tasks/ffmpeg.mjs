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

  const { tempPathOrg, derived } = context.flow.file;
  const { nameEdit } = derived;

  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

  // See: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs#Choosing_a_video_codec

  let isError = false;
  await asyncExec('ffmpeg', [
    '-i', path.resolve(tempPathOrg),
    '-pass', '1',
    '-passlogfile', `${tempPathEdit}.pass`,
    // Video
    '-c:v', 'libx264',
    '-b:v', '2M',
    '-s', '1280x720',
    // Audio
    '-c:a', 'aac',
    '-b:a', '128k',
    // ffmpeg options
    '-maxrate', '2M',
    '-bufsize', '4M',
    '-preset', 'slow',
    '-an', // Disable audio for pass 1.
    '-f', 'rawvideo',
    '-y', // Overwrite by default.
    path.resolve('/dev/null')
  ]).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });

  if (isError) {
    return;
  }

  await asyncExec('ffmpeg', [
    '-i', path.resolve(tempPathOrg),
    '-pass', '2',
    '-passlogfile', `${tempPathEdit}.pass`,
    // Video
    '-c:v', 'libx264',
    '-b:v', '2M',
    '-s', '1280x720',
    // Audio
    '-c:a', 'aac',
    '-b:a', '128k',
    // ffmpeg options
    '-maxrate', '2M',
    '-bufsize', '4M',
    '-preset', 'slow',
    '-y', // Overwrite by default.
    tempPathEdit
  ]).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });

  fs.unlink(path.resolve(`${tempPathEdit}.pass-0.log`), (err) => {
    if (err) throw err;
  });
  fs.unlink(path.resolve(`${tempPathEdit}.pass-0.log.mbtree`), (err) => {
    if (err) throw err;
  });

  if (isError) {
    return;
  }

  context.flow.file.tempPathEdit = tempPathEdit;
};
