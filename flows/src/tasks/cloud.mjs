'use strict';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import NextcloudClient from 'nextcloud-link';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';

const client = new NextcloudClient(CloudCredentials);
const asyncAccess = promisify(fs.access);

const existsInternal = async (filePath) => {
  const existError = await asyncAccess(path.resolve(filePath), fs.constants.F_OK).catch(error => {
    return error;
  });
  if (!existError || existError.code !== 'ENOENT') {
    console.log(`File ${filePath} does exist`);
    return true;
  }
  return false;
};

const existsExternal = async (filePath) => {
  if(await client.exists(path.resolve(filePath))) {
    console.log(`File ${filePath} does exist`);
    return true;
  }
  return false;
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

  isExisting = await existsExternal(`${pathOrg}/${nameOrg}`);

  if (isExisting) {
    return;
  }

  isExisting = await existsExternal(`${pathEdit}/${nameEdit}`);

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
