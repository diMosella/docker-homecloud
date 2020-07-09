'use strict';

import path from 'path';
import asyncSys from './asyncSys.mjs';

const extract = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('next should be a function'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A context temp path must be of type string!'));
  }

  context.flow.call = {
    exec: 'exiftool',
    options: ['-j', '-a', path.resolve(context.flow.file.tempPathOrg)],
    onSuccess: (outLog) => {
      context.flow.file.exif = JSON.parse(outLog)[0];
      return Promise.resolve();
    }
  };
  await asyncSys.call(context, next);
};

export default {
  extract
};
