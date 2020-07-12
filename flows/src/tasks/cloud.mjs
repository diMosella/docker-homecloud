'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import NextcloudClient from 'nextcloud-link';
import Log from '../services/log.mjs';
import messenger from '../basics/messenger.mjs';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';
import { ACTION, TIME_UNIT } from '../basics/constants.mjs';

const client = new NextcloudClient(CloudCredentials);
const asyncAccess = promisify(fs.access);

const log = new Log();

const existsInternal = async (filePath) => {
  const existError = await asyncAccess(path.resolve(filePath), fs.constants.F_OK).catch(error => {
    return Promise.resolve(error);
  });
  if (!existError || existError.code !== 'ENOENT') {
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};

const existsExternal = async (nodePath) => {
  if (typeof nodePath !== 'string') {
    return Promise.reject(new TypeError('A path must be a string!'));
  }

  const inCache = await messenger(
    { action: ACTION.CACHE_GET, payload: { nodePath } },
    null, 0.2, TIME_UNIT.SECOND
  ).catch((error) => log.warn('no return message from cache', error));
  if (!inCache || inCache.action !== ACTION.CACHE_GOT || inCache.payload === null) {
    if (!(await client.exists(path.resolve(nodePath)))) {
      return Promise.resolve(false);
    }
    process.send({ action: ACTION.CACHE_SET, payload: { nodePath, value: true } });
    return Promise.resolve(true);
  }

  switch (typeof inCache.payload) {
    case 'object':
      return Promise.resolve(true);
    case 'boolean':
      if (!inCache.payload) {
        const nowInCache = await messenger(
          { action: ACTION.CACHE_LISTEN, payload: { nodePath } },
          null, 1, TIME_UNIT.SECOND
        ).catch((error) => log.warn('no return message from cache', error));
        if (!nowInCache || nowInCache.action !== ACTION.CACHE_HEARD ||
            nowInCache.payload === null) {
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
 * @param folderPath The path to ensure
 */
const ensureFolderHierarchy = async (folderPath) => {
  if (typeof folderPath !== 'string') {
    return Promise.reject(new TypeError('A folderPath must be a string!'));
  }
  const pathParts = folderPath.split('/').filter((part) => part !== '');
  const precedingParts = [];
  for (const nodeName of pathParts) {
    const cacheResponse = await messenger(
      { action: ACTION.CACHE_GET, payload: { nodePath: '/' } },
      null, 0.2, TIME_UNIT.SECOND
    ).catch((error) => log.warn('no return message from cache', error));
    const cacheAll = cacheResponse && cacheResponse.action === ACTION.CACHE_GOT &&
        cacheResponse.payload
      ? cacheResponse.payload
      : { };
    const parentNode = precedingParts.reduce(
      (accummulator, value) => accummulator[value],
      cacheAll
    );
    const nodePath = `${precedingParts.length > 0
      ? '/'
      : ''}${precedingParts.join('/')}/${nodeName}`;
    switch (typeof parentNode[nodeName]) {
      case 'undefined':
        process.send({ action: ACTION.CACHE_SET, payload: { nodePath, value: false } });
        await client.touchFolder(nodePath);
        process.send({ action: ACTION.CACHE_SET, payload: { nodePath, value: true } });
        break;
      case 'boolean':
        if (!parentNode[nodeName]) {
          await messenger(
            { action: ACTION.CACHE_LISTEN, payload: { nodePath } },
            null, 1, TIME_UNIT.SECOND
          ).catch((error) => log.warn('no return message from cache', error));
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
  if (!context || typeof context.flow === 'undefined' ||
      typeof context.flow.folder === 'undefined' ||
      typeof context.flow.folder.location !== 'string') {
    return Promise.reject(
      new TypeError('A context flow must contain a folder location of type string!')
    );
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
  if (!context || typeof context.flow === 'undefined' ||
      typeof context.flow.file === 'undefined' ||
      typeof context.flow.file.tempPathOrg !== 'string') {
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
  if (!context || typeof context.flow === 'undefined' ||
      typeof context.flow.file === 'undefined' ||
      typeof context.flow.file.tempPathOrg !== 'string') {
    return Promise.reject(new TypeError('A download context path must be of type string!'));
  }
  await client.checkConnectivity();
  const { tempPathOrg } = context.flow.file;
  const error = await client.downloadToStream(
    context.flow.file.path,
    fs.createWriteStream(tempPathOrg)
  ).catch((error) => {
    log.debug('downloading did not succeed', error);
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
  if (!context || typeof context.flow === 'undefined' ||
      typeof context.flow.file === 'undefined' || typeof context.flow.file.path !== 'string') {
    return Promise.reject(new TypeError('A file path must be of type string!'));
  }
  await client.checkConnectivity();
  const { derived } = context.flow.file;
  const { nameOrg, pathOrg } = derived;
  await ensureFolderHierarchy(pathOrg);
  const error = await client.move(
    context.flow.file.path,
    path.resolve(`${pathOrg}/${nameOrg}`)
  ).catch((error) => {
    log.debug('moving did not succeed', error);
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
  if (!context || typeof context.flow === 'undefined' ||
      typeof context.flow.file === 'undefined' ||
      typeof context.flow.file.derived === 'undefined') {
    return Promise.reject(new TypeError('The file derived info must be set!'));
  }
  await client.checkConnectivity();
  const { derived, tempPathEdit } = context.flow.file;
  const { nameEdit, pathEdit } = derived;
  await ensureFolderHierarchy(pathEdit);
  // reminder: streaming implies creating an empty file on NextCloud and
  //  adding bytes to it: therefore user should have create AND edit permissions
  const error = await client.uploadFromStream(
    path.resolve(`${pathEdit}/${nameEdit}`),
    fs.createReadStream(tempPathEdit)
  ).catch((error) => {
    log.debug('uploading did not succeed', error);
    return Promise.resolve(error);
  });
  if (error instanceof Error) {
    return Promise.resolve();
  }
  await next();
};

const getTag = async (tagLabel) => {
  console.log(tagLabel);
  // console.log(client.echoFunc('een test'));
  // console.log(JSON.stringify(client, null, 2));
  const result = await client.getFolderProperties('/remote.php/dav/systemtags/1'
  ,['id', 'display-name', 'user-visible', 'user-assignable', 'can-assign'].map((tagInfo) =>
    ({
      namespace: 'http://owncloud.org/ns',
      namespaceShort: 'oc',
      element: tagInfo
    })
  // JSON.stringify({
    // name: tagLabel,
    // userVisible: true,
    // userAssignable: true,
    // canAssign: true
  // })
  ))
  .catch((error) => {
    log.info('retrieving tag did not succeed', error);
    return Promise.resolve({ error, result: 'nope' });
  });
  console.log(JSON.stringify(result, null, 2));
  return Promise.resolve({ error: null, result });
};

const addTags = async (context, next) => {
  if (typeof next !== 'function') {
    return Promise.reject(new TypeError('A next item must be a function!'));
  }
  if (!context || typeof context.flow === 'undefined' ||
      typeof context.flow.file === 'undefined' ||
      typeof context.flow.file.derived === 'undefined') {
    return Promise.reject(new TypeError('The file derived info must be set!'));
  }
  await client.checkConnectivity();
  // client.echoFunc = (test) => test;
  const { derived } = context.flow.file;
  for (const tagLabel of derived.tagsOrg) {
    const tag = await getTag(tagLabel);
    log.info(JSON.stringify(tag, null, 2));
  }
};

export default {
  getFolderDetails,
  checkForExistence,
  downloadFile,
  ensureFolderHierarchy,
  moveOriginal,
  uploadEdit,
  addTags
};
