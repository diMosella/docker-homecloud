'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
const asyncExec = promisify(execFile);

const call = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('next should be a function'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.call === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A context must have a call!'));
  }

  const { call } = context.flow;
  const { exec, options, onSuccess = () => Promise.resolve(), onFailure = () => Promise.resolve() } = call;

  if (typeof exec !== 'string') {
    return Promise.reject(new TypeError('A call must have an exec of type string'));
  }
  if (!Array.isArray(options)) {
    return Promise.reject(new TypeError('A call must have an options of type array'));
  }
  if (typeof onSuccess !== 'function') {
    return Promise.reject(new TypeError('A call must have a onSuccess of type function'));
  }
  if (typeof onFailure !== 'function') {
    return Promise.reject(new TypeError('A call must have a onFailure of type function'));
  }

  const { error, stdout: outLog } = await asyncExec(exec, options).catch((error) => {
    const { stdout, stderr } = error;
    return Promise.resolve({ error, stdout, stderr });
  });
  if (error) {
    await onFailure();
    return Promise.reject(error);
  }
  await onSuccess(outLog);
  await next();
};

export default {
  call
};
