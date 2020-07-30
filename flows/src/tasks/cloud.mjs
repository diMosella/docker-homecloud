'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import NextcloudClient from 'nextcloud-link';
import Log from '../services/log.mjs';
import cloudTags from './cloudTags.mjs';
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
    { action: ACTION.CACHE_GET, payload: { nodePath } }, null
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
          null, 6, TIME_UNIT.SECOND
        ).catch((error) => log.warn('no return message from cache while listening', error));
        if (!nowInCache || nowInCache.action !== ACTION.CACHE_HEARD ||
            nowInCache.payload !== true) {
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
      { action: ACTION.CACHE_GET, payload: { nodePath: '/' } }, null
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
      case 'undefined': {
        process.send({ action: ACTION.CACHE_SET, payload: { nodePath, value: false } });
        const touchResponse = await client.touchFolder(nodePath)
          .catch((error) => {
            log.warn('error while touching cloud folder', error);
            return Promise.resolve(error);
          });
        if (!(touchResponse instanceof Error)) {
          process.send({ action: ACTION.CACHE_SET, payload: { nodePath, value: true } });
        }
        break;
      }
      case 'boolean':
        if (!parentNode[nodeName]) {
          await messenger(
            { action: ACTION.CACHE_LISTEN, payload: { nodePath } },
            null, 6, TIME_UNIT.SECOND
          ).catch((error) => {
            log.warn('no return message from cache while listening', error);
            return Promise.resolve(error);
          });
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
  const parentDetails = await client.getFolderFileDetails(`/${pathParts.join('/')}`)
    .catch((error) => {
      log.debug('failed to retreive details of parent folder', error);
      return Promise.resolve(error);
    });

  if (parentDetails instanceof Error) {
    return Promise.resolve(parentDetails);
  };
  const nodeDetails = parentDetails.find((item) => item.name === nodeName);
  context.flow.folder.lastModified = new Date(nodeDetails.lastModified).valueOf();
  context.flow.folder.details = await client.getFolderFileDetails(location)
    .catch((error) => {
      log.debug('failed to retreive details of folder', error);
      return Promise.resolve(error);
    });

  if (context.flow.folder.details instanceof Error) {
    return Promise.resolve(context.flow.folder.details);
  };
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
  const targetPath = path.resolve(`${pathEdit}/${nameEdit}`);
  await ensureFolderHierarchy(pathEdit);
  // reminder: streaming implies creating an empty file on NextCloud and
  //  adding bytes to it: therefore user should have create AND edit permissions
  const error = await client.uploadFromStream(
    targetPath,
    fs.createReadStream(tempPathEdit)
  ).catch((error) => {
    log.debug('uploading did not succeed', error);
    return Promise.resolve(error);
  });
  if (error instanceof Error) {
    return Promise.resolve(error);
  }
  await client.getFolderFileDetails(targetPath);
  await next();
};

const _addTags = async (path, tags, existingTags) => {
  const fileProps = await cloudTags.getFileProps(path)
    .catch(error => Promise.resolve(error));
  if (fileProps instanceof Error) {
    return Promise.resolve(fileProps);
  }
  for (const tagLabel of tags) {
    const tagCandidate = existingTags.find(item => item.name === tagLabel) ||
      await cloudTags.createTag(tagLabel);
    if (tagCandidate instanceof Error) {
      break;
    }
    if (!existingTags.some(item => item.name === tagLabel)) {
      existingTags.push(tagCandidate);
    }
    if (!fileProps.tags || !fileProps.tags.some(tag => tag.id === tagCandidate.id)) {
      await cloudTags.setTag(fileProps.id, tagCandidate.id);
    }
  }
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

  const existingTags = await cloudTags.getTags();
  if (existingTags instanceof Error) {
    return Promise.resolve(existingTags);
  }

  const { derived } = context.flow.file;
  const { nameOrg, pathOrg, nameEdit, pathEdit, tagsOrg, tagsEdit } = derived;

  const fileOrg = path.resolve(`${pathOrg}/${nameOrg}`);
  const fileEdit = path.resolve(`${pathEdit}/${nameEdit}`);

  await _addTags(fileOrg, tagsOrg, existingTags);
  await _addTags(fileEdit, tagsEdit, existingTags);

  await next();
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
