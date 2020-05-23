'use strict';
import { enumerate, EnumProperties } from './enum.mjs';

const VALID_REGEXP = /[a-zA-Z0-9À-ž\/\-_\.]+/;

export const STATE = enumerate('queued', 'locked', 'processed');
export const ACTION = enumerate (
  new EnumProperties('added', 'added item to queue'),
  new EnumProperties('start', 'start processing queue')
);

export const notify = async (ctx, next) => {
  const { actor, owner, path } = ctx.request.query;
  const isValid = typeof actor === 'string' && typeof owner === 'string' && typeof path === 'string'
    && VALID_REGEXP.test(actor) && VALID_REGEXP.test(owner) && VALID_REGEXP.test(path);

  if (isValid) {
    process.send({ action: ACTION.ADDED, payload: Object.assign({}, ctx.request.query, { timestamp: Date.now(), state: STATE.QUEUED }) });
  }
  await next();
};
