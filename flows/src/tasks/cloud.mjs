'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import NextcloudClient from 'nextcloud-link';
import messenger from '../basics/messenger.mjs';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

const client = new NextcloudClient(CloudCredentials);
const asyncAccess = promisify(fs.access);

const existsInternal = async (filePath) => {
  const existError = await asyncAccess(path.resolve(filePath), fs.constants.F_OK).catch(error => {
    return Promise.resolve(error);
  });
  if (!existError || existError.code !== 'ENOENT') {
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};

const existsExternal = async (filePath) => {
  if (typeof filePath !== 'string') {
    return Promise.reject(new TypeError('A path must be a string!'));
  }

  const inCache = await messenger({ action: ACTION.CACHE_GET, payload: { filePath } }, null, 0.2, TIME_UNIT.SECOND)
    .catch((err) => console.log('no-cache', err));
  if (!inCache || inCache.action !== ACTION.CACHE_GOT || inCache.payload === null) {
    if (!(await client.exists(path.resolve(filePath)))) {
      return Promise.resolve(false);
    }
    process.send({ action: ACTION.CACHE_SET, payload: { filePath, value: true } });
    return Promise.resolve(true);
  }

  switch (typeof inCache.payload) {
    case 'object':
      return Promise.resolve(true);
    case 'boolean':
      if (!inCache.payload) {
        const nowInCache = await messenger({ action: ACTION.CACHE_LISTEN, payload: { filePath } }, null, 1, TIME_UNIT.SECOND)
          .catch((err) => console.log('no-cache', err));
        if (!nowInCache || inCache.action !== ACTION.CACHE_HEARD || inCache.payload === null) {
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(true);
    default:
      return Promise.resolve(false);
  }
};

/**
 * Ensure that a path / folder hierarchy does exist
 * @param cloudCache The cache to read and write
 * @param folderPath The path to ensure
 */
const ensureFolderHierarchy = async (cloudCache, folderPath) => { // FIXME: cloudCache via messenger
  if (!(cloudCache instanceof Cache)) {
    return Promise.reject(new TypeError('A cloudCache must be a Cache!'));
  }
  if (typeof folderPath !== 'string') {
    return Promise.reject(new TypeError('A folderPath must be a string!'));
  }
  const pathParts = folderPath.split('/').filter((part) => part !== '');
  const precedingParts = [];
  for (const nodeName of pathParts) {
    const parentNode = precedingParts.reduce((accummulator, value) => accummulator[value], cloudCache.all);
    const nodePath = `${precedingParts.length > 0 ? '/' : ''}${precedingParts.join('/')}/${nodeName}`;
    switch (typeof parentNode[nodeName]) {
      case 'undefined':
        cloudCache.set(nodePath, false);
        await client.touchFolder(nodePath);
        cloudCache.set(nodePath, true);
        break;
      case 'boolean':
        if (!parentNode[nodeName]) {
          await cloudCache.listen(nodePath);
        }
        break;
      default:
        break;
    }
    precedingParts.push(nodeName);
  }
};

const getFolderDetails = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('A next item must be a function!'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.folder === 'undefined' || typeof context.flow.folder.location !== 'string') {
    return Promise.reject(new TypeError('A context flow must contain a folder location of type string!'));
  }
  const { location } = context.flow.folder;
  await client.checkConnectivity();
  const pathParts = location.split('/').filter((part) => part !== '');
  const nodeName = pathParts.pop();
  const parentDetails = await client.getFolderFileDetails(`/${pathParts.join('/')}`);
  const nodeDetails = parentDetails.find((item) => item.name === nodeName);
  context.flow.folder.lastModified = new Date(nodeDetails.lastModified).valueOf();
  context.flow.folder.details = await client.getFolderFileDetails(location);
  await next();
};

const checkForExistence = async (context, next) => {
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A context temp path must be of type string!'));
  }

  const { tempPathOrg, derived } = context.flow.file;

  let isExisting = false;

  if (!derived) {
    isExisting = await existsInternal(tempPathOrg);
    if (isExisting) {
      return Promise.resolve();
    }
    return await next();
  }

  const { pathEdit, nameEdit, pathOrg, nameOrg } = derived;
  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

  isExisting = await existsInternal(tempPathEdit);

  if (isExisting) {
    return Promise.resolve();
  }
  isExisting = await existsExternal(`${pathOrg}/${nameOrg}`);
  if (isExisting) {
    return Promise.resolve();
  }

  isExisting = await existsExternal(`${pathEdit}/${nameEdit}`);

  if (isExisting) {
    return Promise.resolve();
  }

  await next();
};

const downloadFile = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('A next item must be a function!'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A download context path must be of type string!'));
  }
  await client.checkConnectivity();
  const { tempPathOrg } = context.flow.file;
  const error = await client.downloadToStream(context.flow.file.path, fs.createWriteStream(tempPathOrg)).catch((error) => {
    console.log('download', error);
    return Promise.resolve(error);
  });

  if (error instanceof Error) {
    return Promise.resolve();
  }

  await next();
};

const moveOriginal = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('A next item must be a function!'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.path !== 'string') {
    return Promise.reject(new TypeError('A file path must be of type string!'));
  }
  await client.checkConnectivity();
  const { derived } = context.flow.file;
  const { nameOrg, pathOrg } = derived;
  await ensureFolderHierarchy(context.flow.cache, pathOrg);
  console.log('move', path.resolve(`${pathOrg}/${nameOrg}`));
  const error = await client.move(context.flow.file.path, path.resolve(`${pathOrg}/${nameOrg}`)).catch((error) => {
    console.log('move', error);
    return Promise.resolve(error);
  });

  if (error instanceof Error) {
    return Promise.resolve();
  }
  await next();
};

const uploadEdit = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('A next item must be a function!'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.derived === 'undefined') {
    return Promise.reject(new TypeError('The file derived info must be set!'));
  }
  await client.checkConnectivity();
  const { derived, tempPathEdit } = context.flow.file;
  const { nameEdit, pathEdit } = derived;
  await ensureFolderHierarchy(context.flow.cache, pathEdit);
  const error = await client.uploadFromStream(path.resolve(`${pathEdit}/${nameEdit}`), fs.createReadStream(tempPathEdit)).catch((error) => {
    console.log('upload edit', error);
    return Promise.resolve(error);
  });
  if (error instanceof Error) {
    return Promise.resolve();
  }
  await next();
};

const getTag = async (tagLabel) => {
  await client.put('/remote.php/dav/systemtags/', JSON.stringify({
    name: tagLabel,
    userVisible: true,
    userAssignable: true,
    canAssign: true
  })).catch((err) => {
    console.log(err);
  });
};

const addTags = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('A next item must be a function!'));
  }
  if (!context || typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.derived === 'undefined') {
    return Promise.reject(new TypeError('The file derived info must be set!'));
  }
  await client.checkConnectivity();
  const { derived } = context.flow.file;
  derived.tagsOrg.forEach(async (tagLabel) => { // FIXME: foreach doesn't handle async well
    const tag = await getTag(tagLabel);
    console.log('tagLabel', tag);
  });
};

export default {
  getFolderDetails,
  checkForExistence,
  downloadFile,
  ensureFolderHierarchy,
  moveOriginal,
  uploadEdit
};
