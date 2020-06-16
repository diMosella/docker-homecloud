'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import NextcloudClient from 'nextcloud-link';
import messenger from '../basics/messenger.mjs';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';
import { ACTION } from '../basics/constants.mjs';

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

const existsExternal = async (filePath, wid) => {
  const message = await messenger({ action: ACTION.CAN_ENSURE, payload: { wid, path: filePath, willEnsure: false } })
      .catch((err) => console.log('no-msg', err));

  if (message && message.action === ACTION.ENSURE) {
    console.log('exists', message.payload);
    if (message.payload.isEnsured) {
      return true;
    }
    if (message.payload.canEnsure) {
      if(await client.exists(path.resolve(filePath))) {
        process.send({ action: ACTION.FINISH_ENSURE, payload: { wid, path: filePath }});
        return true;
      }
    }
  }
  return false;
};

const ensureFolderHierarchy = async (folderPath, wid) => {
  const message = await messenger({ action: ACTION.CAN_ENSURE, payload: { wid, path: folderPath, willEnsure: true } })
      .catch((err) => console.log('no-msg', err));

  if (message && message.action === ACTION.ENSURE) {
    console.log('ensure', message.payload);
    const { isEnsured, canEnsure, toEnsure } = message.payload;
    if (isEnsured) {
      return true;
    }
    if (canEnsure && Array.isArray(toEnsure) && toEnsure.length > 0) {
      const startEnsureIndex = folderPath.length - toEnsure.join('/').length - 1;
      let accummulatedPath = folderPath.substring(0, startEnsureIndex);
      toEnsure.forEach(async (folderName) => {
        accummulatedPath = path.resolve(`${accummulatedPath}/${folderName}`);
        console.log('current', accummulatedPath);
        await client.touchFolder(accummulatedPath).catch((err) => {
          console.log('touch', err);
        });
      });
      process.send({ action: ACTION.FINISH_ENSURE, payload: { wid, path: folderPath } });
    }
  }
};

export const getFolderDetails = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.folder === 'undefined' || typeof context.flow.folder.name !== 'string') {
    throw new TypeError('A context flow must contain a folder name of type string!');
  }
  await client.checkConnectivity();
  context.flow.folder.details = await client.getFolderFileDetails(context.flow.folder.name);
  return await next();
};

export const checkForExistence = async (context, next) => {
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A context temp path must be of type string!');
  }

  const { tempPathOrg, derived } = context.flow.file;

  let isExisting = false

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

  isExisting = await existsExternal(`${pathOrg}/${nameOrg}`, context.wid);

  if (isExisting) {
    return;
  }

  isExisting = await existsExternal(`${pathEdit}/${nameEdit}`, context.wid);

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
  await client.downloadToStream(context.flow.file.path, fs.createWriteStream(tempPathOrg)).catch((err) => {
    console.log(err);
  });
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
  await ensureFolderHierarchy(pathOrg, context.wid);
  console.log('move', path.resolve(`${pathOrg}/${nameOrg}`));
  // TODO:  still conflicts while moving / uploading: what if canEnsure is false, what if simultaneous, etc...
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
  await ensureFolderHierarchy(pathEdit, context.wid);
  await client.uploadFromStream(path.resolve(`${pathEdit}/${nameEdit}`), fs.createReadStream(tempPathEdit)).catch((err) => {
    console.log('upload edit', err);
  });
  return await next();
};

const getTag = async (tagLabel) => {
  return await client.put(`/remote.php/dav/systemtags/`, JSON.stringify({
    name: tagLabel,
    userVisible: true,
    userAssignable: true,
    canAssign: true
  })).catch((err) => {
    console.log(err);
  });
  return { test: true };
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
  derived.tagsOrg.forEach(async (tagLabel) => {
    const tag = await getTag(tagLabel);
    console.log('tagLabel', tag);
  });
};
