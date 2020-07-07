'use strict';

import path from 'path';
import asyncSys from './asyncSys.mjs';
import { tempFolder } from '../basics/config.mjs';

const convert = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('next should be a function'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A context temp path must be of type string!'));
  }

  const { tempPathOrg, derived } = context.flow.file;
  const { nameEdit } = derived;

  const tempPathIntermediate = path.resolve(`${tempFolder}/${nameEdit}.tif`);

  context.flow.call = {
    exec: 'rawtherapee-cli',
    options: ['-o', `${tempPathIntermediate}`, '-t', '-Y', '-d', '-c', path.resolve(tempPathOrg)],
    onSuccess: (_outLog) => {
      context.flow.file.tempPathIntermediate = tempPathIntermediate;
      return Promise.resolve();
    }
  };
  await asyncSys.call(context, next);
};

export default {
  convert
};
