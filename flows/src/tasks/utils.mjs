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
        context.flow.folder.changes.push(detail);
    }
  });
  return await next();
};

export const deriveInfo = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined') {
    throw new TypeError('A context flow must contain file information');
  }

  const { details, exif } = context.flow.file;
  const dates = [
    new Date(exif.DateTimeOriginal),
    new Date(exif.FileModifyDate.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, `$1-$2-$3T`)),
    new Date(details.lastModified)
  ]
      .filter((date) => date instanceof Date && !isNaN(date && date.valueOf() > 0))
      .sort((dateA, dateB) => dateA.valueOf() - dateB.valueOf());
  context.flow.file.derived = {
    name: `${dates[0].toISOString().replace(/(-|:|\.\d{3}Z)/g, '')}-Model-Creator.${exif.FileTypeExtension}`
  };
  await next();
};
