'use strict';

export const checkForChanges = (getLastWatch) => async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.folder === 'undefined' || !Array.isArray(context.flow.folder.details)) {
    throw new TypeError('A context flow must contain folder details of type array!');
  }
  const lastWatch = getLastWatch();
  if (typeof lastWatch !== 'number') {
    throw new TypeError('LastWatch must be a number!');
  }

  if(!Array.isArray(context.flow.folder.changes)) {
    context.flow.folder.changes = [];
  }

  context.flow.folder.details.forEach((detail) => {
    if (detail.isDirectory) {
      return;
    }
    const modified = new Date(detail.lastModified).valueOf();
    if (modified > lastWatch) {
        context.flow.folder.changes.push(detail.name);
    }
  });
  console.log('changes:', context.flow.folder.changes);
  return await next();
};
