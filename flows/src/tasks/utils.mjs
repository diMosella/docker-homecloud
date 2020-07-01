'use strict';

import path from 'path';
import { convert as imageConvert } from './imagemagick.mjs';
import { convert as rawConvert } from './rawtherapee.mjs';
import { convert as movieConvert } from './ffmpeg.mjs';
import { convert as documentConvert } from './tesseract.mjs';
import { basePaths } from '../basics/config.mjs';
import { SOURCE, CAMERA, MONTH, FILE_CATEGORY } from '../basics/constants.mjs';

const cleanExifDate = (exifDate) => exifDate
  ? exifDate.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, '$1-$2-$3T').replace(/\s+DST\s*$/i, '')
  : null;
const simpleFormatDate = (date) => date.toISOString().replace(/(-|:|\.\d{3}Z)/g, '');
const noConvert = async (context, next) => {
  await next();
};
const conversionMap = {
  jpg: { converters: [imageConvert] },
  jpeg: { converters: [imageConvert], editExtension: 'jpg' },
  png: { converters: [imageConvert] },
  arw: { converters: [rawConvert, imageConvert], editExtension: 'jpg' },
  mp4: { converters: [movieConvert] },
  mov: { converters: [movieConvert], editExtension: 'mp4' },
  mts: { converters: [movieConvert], editExtension: 'mp4' },
  pdf: { converters: [documentConvert] },
  aae: { converters: [noConvert] }
};

const sonyReg = /^(DSC)?\d{5}\.(MTS|ARW)$/i;
const scanReg = /^SCAN-[a-z]{1}(\d{4})?\.PDF$/i;
const iPhoneReg = /^IMG_\d{4}\.(JPG|MOV|AAE)$/i;
const extReg = /\.(JPG|JPEG|PNG|AAE|ARW|MP4|MOV|MTS|PDF)$/i;

const checkForChanges = (lastScan) => async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.folder === 'undefined' || !Array.isArray(context.flow.folder.details)) {
    throw new TypeError('A context flow must contain folder details of type array!');
  }
  const lastScanTimestamp = lastScan.timestamp;
  if (typeof lastScanTimestamp !== 'number') {
    throw new TypeError('lastScanTimestamp must be a number!');
  }

  if (!Array.isArray(context.flow.folder.changes)) {
    context.flow.folder.changes = [];
  }

  if (lastScanTimestamp > context.flow.folder.lastModified) {
    return;
  }

  for (const detail of context.flow.folder.details) {
    if (detail.isDirectory) {
      return;
    }
    if (extReg.test(path.extname(detail.name))) {
      context.flow.folder.changes.push(detail);
    }
  }
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
    new Date(cleanExifDate(exif.FileCreateDate)),
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
  let category = FILE_CATEGORY.MEDIA;
  let source = SOURCE.getProperty(SOURCE.EXT, 'label');
  if (camera === CAMERA.NEX_5T && make === SOURCE.SONY && folder === SOURCE.SONY && sonyReg.test(name)) {
    tags.push(SOURCE.getProperty(make, 'label'));
    source = SOURCE.getProperty(make, 'label');
  } else if ((folder === SOURCE.ABIGAIL_SCAN || folder === SOURCE.WIM_SCAN || folder === SOURCE.DIMOSELLA_SCAN) && scanReg.test(name)) {
    tags.push(SOURCE.getProperty(folder, 'label'));
    tags.push('Scan');
    category = FILE_CATEGORY.DOCS;
    source = `${SOURCE.getProperty(folder, 'label')}-Scan`;
  } else if (camera === CAMERA.IPHONE_SE && (folder === SOURCE.ABIGAIL || folder === SOURCE.WIM) && iPhoneReg.test(name)) {
    tags.push(SOURCE.getProperty(folder, 'label'));
    tags.push(CAMERA.getProperty(camera, 'label').replace(/\s/, ''));
    source = `${SOURCE.getProperty(folder, 'label')}-${CAMERA.getProperty(camera, 'label').replace(/\s/, '')}`;
  } else {
    tags.push(SOURCE.getProperty('EXT', 'label'));
  }

  console.log('Derived :: source:', `${name} -> ${source}`);

  const year = dates[0].getFullYear();
  const month = (dates[0].getMonth() + 1).toString().padStart(2, '0');
  const date = dates[0].getDate().toString().padStart(2, '0');

  tags.push(year, MONTH.getProperty(dates[0].getMonth(), 'value').toLowerCase());

  const tagsOrg = [...tags, 'org'];
  const tagsEdit = [...tags, 'edit'];

  const editExtension = conversionMap[exif.FileTypeExtension].editExtension || exif.FileTypeExtension;

  const datePath = `${year}/${year}-${month}/${year}-${month}-${date}`;
  context.flow.file.derived = {
    nameOrg: `${simpleFormatDate(dates[0])}-${source}-org.${exif.FileTypeExtension}`,
    pathOrg: `${basePaths[FILE_CATEGORY.getProperty(category, 'value')].org}/${datePath}`,
    tagsOrg,
    nameEdit: `${simpleFormatDate(dates[0])}-${source}-edit.${editExtension}`,
    pathEdit: `${basePaths[FILE_CATEGORY.getProperty(category, 'value')].edit}/${datePath}`,
    tagsEdit,
    editExtension
  };
  await next();
};

export const convert = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined') {
    throw new TypeError('A context flow must contain file information');
  }

  const { exif } = context.flow.file;
  const { FileTypeExtension } = exif;

  const converters = conversionMap[FileTypeExtension].converters;
  let index = 0;
  while (index < converters.length) {
    await converters[index++](context, next);
  }
  await next();
};

export default {
  checkForChanges
};
