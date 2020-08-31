'use strict';

import path from 'path';
import asyncSys from './asyncSys.mjs';
import { tempFolder } from '../basics/config.mjs';

const convert = async (context, next) => {
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

  context.flow.call = {
    exec: 'ocrmypdf',
    options: [
      '--rotate-pages', '--deskew', '-l', 'nld+eng', '--clean',
      path.resolve(tempPathOrg), tempPathEdit
    ],
    onSuccess: (_outLog) => {
      context.flow.file.tempPathEdit = tempPathEdit;
      return Promise.resolve();
    }
  };
  await asyncSys.call(context, next);
};

export default {
  convert
};
