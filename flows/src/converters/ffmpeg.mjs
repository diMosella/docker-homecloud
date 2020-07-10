'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import asyncSys from './asyncSys.mjs';
import { tempFolder } from '../basics/config.mjs';

const asyncUnlink = promisify(fs.unlink);

const convert = (step) => {
  if (typeof step !== 'number' || ![1, 2].includes(step)) {
    throw new TypeError('A step must be of type number!');
  }

  return async (context, next) => {
    if (typeof next !== 'function') {
      return Promise.reject(new TypeError('next should be a function'));
    }
    if (!context || typeof context.flow === 'undefined' ||
        typeof context.flow.file === 'undefined' ||
        typeof context.flow.file.tempPathOrg !== 'string') {
      return Promise.reject(new TypeError('A context temp path must be of type string!'));
    }

    const { tempPathOrg, derived } = context.flow.file;
    const { nameEdit } = derived;

    const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

    const clean = async () => {
      const tempPathIntermediate = path.resolve(`${tempPathEdit}.pass-0.log`);
      await asyncUnlink(path.resolve(tempPathIntermediate))
        .catch((_error) => Promise.resolve());
      return await asyncUnlink(path.resolve(`${tempPathIntermediate}.mbtree`))
        .catch((_error) => Promise.resolve());
    };

    context.flow.call = {
      exec: 'ffmpeg',
      options: [
        '-i', path.resolve(tempPathOrg),
        '-pass', `${step}`,
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
        '-preset', 'slow'
      ],
      onFailure: async () => {
        await clean();
      }
    };
    if (step === 1) {
      context.flow.call.options.push(
        '-an', // Disable audio for pass 1.
        '-f', 'rawvideo',
        '-y', // Overwrite by default.
        path.resolve('/dev/null')
      );
    } else {
      context.flow.call.options.push(
        '-y', // Overwrite by default.
        tempPathEdit
      );
      context.flow.call.onSuccess = async (_outLog) => {
        context.flow.file.tempPathEdit = tempPathEdit;
        await clean();
      };
    }
    await asyncSys.call(context, next);
  };
};

export default {
  convert
};
