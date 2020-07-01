'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import NextcloudClient from 'nextcloud-link';
import Cache from '../services/cache.mjs';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';

const client = new NextcloudClient(CloudCredentials);
const asyncAccess = promisify(fs.access);

const existsInternal = async (filePath) => {
  const existError = await asyncAccess(path.resolve(filePath), fs.constants.F_OK).catch(error => {
    return error;
  });
  if (!existError || existError.code !== 'ENOENT') {
    return true;
  }
  return false;
};

const existsExternal = async (cloudCache, filePath) => {
  if (!(cloudCache instanceof Cache)) {
    throw new TypeError('A cloudCache must be a Cache!');
  }
  if (typeof filePath !== 'string') {
    throw new TypeError('A path must be a string!');
  }

  const inCache = cloudCache.getByPath(filePath);
  console.log('inCache', inCache);

  switch (typeof inCache) {
    case 'object':
      if (inCache === null) {
        if (!(await client.exists(path.resolve(filePath)))) {
          return false;
        }
        cloudCache.set(filePath, true);
      }
      return true;
    case 'boolean':
      if (!inCache) {
        await cloudCache.listen(filePath);
      }
      return true;
    default:
      return false;
  }
};

/**
 * Ensure that a path / folder hierarchy does exist
 * @param cloudCache The cache to read and write
 * @param folderPath The path to ensure
 */
export const ensureFolderHierarchy = async (cloudCache, folderPath) => {
  if (!(cloudCache instanceof Cache)) {
    throw new TypeError('A cloudCache must be a Cache!');
  }
  if (typeof folderPath !== 'string') {
    throw new TypeError('A folderPath must be a string!');
  }
  const pathParts = folderPath.split('/').filter((part) => part !== '');
  const precedingParts = [];
  for (const nodeName of pathParts) {
    const parentNode = precedingParts.reduce((accummulator, value) => accummulator[value], cloudCache.get);
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
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.folder === 'undefined' || typeof context.flow.folder.location !== 'string') {
    throw new TypeError('A context flow must contain a folder location of type string!');
  }
  const { location } = context.flow.folder;
  await client.checkConnectivity();
  const pathParts = location.split('/').filter((part) => part !== '');
  const nodeName = pathParts.pop();
  const parentDetails = await client.getFolderFileDetails(`/${pathParts.join('/')}`);
  const nodeDetails = parentDetails.find((item) => item.name === nodeName);
  context.flow.folder.lastModified = new Date(nodeDetails.lastModified).valueOf();
  context.flow.folder.details = await client.getFolderFileDetails(location);
  return await next();
};

export const checkForExistence = async (context, next) => {
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A context temp path must be of type string!');
  }

  const { tempPathOrg, derived } = context.flow.file;

  let isExisting = false;

  if (!derived) {
    isExisting = await existsInternal(tempPathOrg);
    if (isExisting) {
      return;
    }
    return await next();
  }

  const { pathEdit, nameEdit, pathOrg, nameOrg } = derived;
  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

  isExisting = await existsInternal(tempPathEdit);

  if (isExisting) {
    return;
  }
  isExisting = await existsExternal(context.flow.cache, `${pathOrg}/${nameOrg}`);
  if (isExisting) {
    return;
  }

  isExisting = await existsExternal(context.flow.cache, `${pathEdit}/${nameEdit}`);

  if (isExisting) {
    return;
  }

  return await next();
};

export const downloadFile = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A download context path must be of type string!');
  }
  await client.checkConnectivity();
  const { tempPathOrg } = context.flow.file;
  let isError = false;
  await client.downloadToStream(context.flow.file.path, fs.createWriteStream(tempPathOrg)).catch((err) => {
    console.log('download', err);
    isError = true;
  });

  if (isError) {
    return;
  }

  return await next();
};

export const moveOriginal = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.path !== 'string') {
    throw new TypeError('A file path must be of type string!');
  }
  await client.checkConnectivity();
  const { derived } = context.flow.file;
  const { nameOrg, pathOrg } = derived;
  await ensureFolderHierarchy(context.flow.cache, pathOrg);
  console.log('move', path.resolve(`${pathOrg}/${nameOrg}`));
  await client.move(context.flow.file.path, path.resolve(`${pathOrg}/${nameOrg}`)).catch((err) => {
    console.log('move', err);
  });
  return await next();
};

export const uploadEdit = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.derived === 'undefined') {
    throw new Error('The file derived info must be set!');
  }
  await client.checkConnectivity();
  const { derived, tempPathEdit } = context.flow.file;
  const { nameEdit, pathEdit } = derived;
  await ensureFolderHierarchy(context.flow.cache, pathEdit);
  await client.uploadFromStream(path.resolve(`${pathEdit}/${nameEdit}`), fs.createReadStream(tempPathEdit)).catch((err) => {
    console.log('upload edit', err);
  });
  return await next();
};

const getTag = async (tagLabel) => {
  return await client.put('/remote.php/dav/systemtags/', JSON.stringify({
    name: tagLabel,
    userVisible: true,
    userAssignable: true,
    canAssign: true
  })).catch((err) => {
    console.log(err);
  });
};

export const addTags = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.derived === 'undefined') {
    throw new Error('The file derived info must be set!');
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
  downloadFile
};
