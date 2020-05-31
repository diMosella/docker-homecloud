'use strict';

import path from 'path';
import { basePaths } from '../basics/config.mjs';
import { SOURCE, CAMERA, MONTH } from '../basics/constants.mjs';

const cleanExifDate = (exifDate) => exifDate ? exifDate.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, `$1-$2-$3T`) : null;
const simpleFormatDate = (date) => date.toISOString().replace(/(-|:|\.\d{3}Z)/g, '');

const sonyReg = /^(DSC)?\d{5}\.(MTS|ARW)$/i;
const scanReg = /^SCAN(\d{4})?\.PDF$/i;
const iPhoneReg = /^IMG_\d{4}\.(JPG|MOV|AAE)$/i;
const extReg = /\.(JPG|JPEG|PNG|AAE|ARW|MP4|MOV|MTS|PDF)$/i;

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
    if (modified > lastWatch && extReg.test(path.extname(detail.name))) {
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
    new Date(cleanExifDate(exif.DateTimeOriginal)),
    new Date(cleanExifDate(exif.CreateDate)),
    new Date(cleanExifDate(exif.FileModifyDate)),
    new Date(details.lastModified)
  ]
      .filter((date) => date instanceof Date && !isNaN(date) && date.valueOf() > 0)
      .sort((dateA, dateB) => dateA.valueOf() - dateB.valueOf());

  const { Make, Model } = exif;
  const { name } = details;
  const camera = CAMERA.findBy('label', Model);
  const make = SOURCE.findBy('label', Make);
  const folder = SOURCE.findBy('code', context.flow.file.folder);

  const tags = [];
  let source = SOURCE.properties[SOURCE.EXT].label;
  if (camera === CAMERA.NEX_5T && make === SOURCE.SONY && folder === SOURCE.SONY && sonyReg.test(name)) {
    tags.push(SOURCE.properties[make].label);
    source = SOURCE.properties[make].label;
    console.log('source:', source);
  } else if (folder === SOURCE.SCAN && scanReg.test(name)) {
    tags.push(SOURCE.properties[folder].label);
    source = SOURCE.properties[folder].label;
    console.log('source:', source);
  } else if (camera === CAMERA.IPHONE_SE && (folder === SOURCE.ABIGAIL || folder === SOURCE.WIM) && iPhoneReg.test(name)) {
    tags.push(SOURCE.properties[folder].label);
    tags.push(CAMERA.properties[camera].label.replace(/\s/, ''));
    source = `${SOURCE.properties[folder].label}-${CAMERA.properties[camera].label.replace(/\s/, '')}`;
    console.log('source:', source);
  } else {
    tags.push(SOURCE.properties[SOURCE.EXT].label);
    console.log('source:', source);
  }

  const year = dates[0].getFullYear();
  const month = (dates[0].getMonth() + 1).toString().padStart(2, '0');
  const date = dates[0].getDate().toString().padStart(2, '0');

  tags.push(year, MONTH.properties[dates[0].getMonth()].value.toLowercase());

  const datePath = `${year}/${year}-${month}/${year}-${month}-${date}`;
  context.flow.file.derived = {
    tags,
    nameOrg: `${simpleFormatDate(dates[0])}-${source}-org.${exif.FileTypeExtension}`,
    pathOrg: `${basePaths.org}/${datePath}`,
    nameEdit: `${simpleFormatDate(dates[0])}-${source}.${exif.FileTypeExtension}`,
    pathEdit: `${basePaths.edit}/${datePath}`
  };
  await next();
};
