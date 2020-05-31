'use strict';

import fs from 'fs';
import path from 'path';
import NextcloudClient from 'nextcloud-link';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';

const client = new NextcloudClient(CloudCredentials);

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

export const downloadFile = async (context, next) => {
  if (typeof next !== 'function') {
    throw new TypeError('A next item must be a function!');
  }
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.path !== 'string') {
    throw new TypeError('A download context path must be of type string!');
  }
  await client.checkConnectivity();
  const tempPathOrg = path.resolve(`${tempFolder}/${path.basename(context.flow.file.path)}`);
  await client.downloadToStream(context.flow.file.path, fs.createWriteStream(tempPathOrg)).catch((err) => {
    console.log(err);
  });
  context.flow.file.tempPathOrg = tempPathOrg;
  return await next();
}
