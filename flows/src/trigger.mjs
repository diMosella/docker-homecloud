'use strict';
import { enumerate, EnumProperties } from './enum.mjs';

const VALID_REGEXP = /[a-zA-Z0-9À-ž\/\-_\.]+/;

export const STATE = enumerate('validated', 'queued', 'locked', 'processed');
export const ACTION = enumerate (
  new EnumProperties('add', 'add item to queue'),
  new EnumProperties('wait', 'wait to start queue'),
  new EnumProperties('start', 'start processing queue'),
  new EnumProperties('lock', 'lock queue item'),
  new EnumProperties('finish', 'finish processing queue item')
);

export const notify = async (ctx, next) => {
  const { actor, owner, path } = ctx.request.query;
  const isValid = typeof actor === 'string' && typeof owner === 'string' && typeof path === 'string'
    && VALID_REGEXP.test(actor) && VALID_REGEXP.test(owner) && VALID_REGEXP.test(path);

  if (isValid) {
    process.send({ action: ACTION.ADD, payload: Object.assign({}, ctx.request.query, { timestamp: Date.now(), state: STATE.VALIDATED }) });
  }
  await next();
};
