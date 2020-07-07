'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import asyncSys from './asyncSys.mjs';
import { tempFolder } from '../basics/config.mjs';

const asyncUnlink = promisify(fs.unlink);

const convert = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('next should be a function'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A context temp path must be of type string!'));
  }

  const { tempPathOrg, tempPathIntermediate, derived } = context.flow.file;
  const { nameEdit } = derived;

  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);
  const original = tempPathIntermediate || tempPathOrg;

  const clean = async () => {
    if (tempPathIntermediate) {
      return await asyncUnlink(path.resolve(tempPathIntermediate))
        .catch((_error) => Promise.resolve());
    }
    return Promise.resolve();
  };

  context.flow.call = {
    exec: 'convert',
    options: [path.resolve(original), '-auto-gamma', '-auto-level', '-normalize', tempPathEdit],
    onSuccess: async (_outLog) => {
      context.flow.file.tempPathEdit = tempPathEdit;
      await clean();
    }
  };
  await asyncSys.call(context, next);
};

export default {
  convert
};
