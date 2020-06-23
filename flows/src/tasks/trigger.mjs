'use strict';

import { ACTION, STATE } from '../basics/constants.mjs';

const VALID_REGEXP = /[a-zA-Z0-9À-ž/\-_.]+/;

export const notify = async (ctx, next) => {
  const { actor, owner, path } = ctx.request.query;
  console.log('req', ctx.request);
  const isValid = typeof actor === 'string' && typeof owner === 'string' && typeof path === 'string' &&
    VALID_REGEXP.test(actor) && VALID_REGEXP.test(owner) && VALID_REGEXP.test(path);

  if (isValid) {
    process.send({ action: ACTION.ADD, payload: Object.assign({}, ctx.request.query, { timestamp: Date.now(), state: STATE.VALIDATED }) });
  }
  ctx.body = { success: isValid };
  await next();
};
