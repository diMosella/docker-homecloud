'use strict';

import fs from 'fs';
import path from 'path';
import NextcloudClient from 'nextcloud-link';
import { cloud as CloudCredentials } from '../basics/credentials.mjs';
import { tempFolder } from '../basics/config.mjs';

const client = new NextcloudClient(CloudCredentials);

export const read = async (payload, next) => {
  await client.checkConnectivity();
  // await client.touchFolder('/example');
  // await client.put('/example/file.txt', 'Hello!');
  // await client.move('/example', '/otherlocation');
  // const content = await client.getReadStream(payload.path);
  // const text = await client.get('/otherlocation/file.txt');
  /* const file = await client.downloadToStream(payload.path, fs.createWriteStream(path.resolve('/home/wim/temp/test'))).catch((err) => {
    console.log(err);
  }); */
  // const file = await client.getFiles('/vanMoosel Fotos').catch((err) => {
  //   console.log(err);
  // });
  // console.log('dir', file);
  // await client.uploadFromStream('/vanMoosel Fotos/_uploads/eekhoorn-20190911.jpg', fs.createReadStream(path.resolve('../eekhoorn-20190911.jpg'))).catch((err) => {
  //   console.log(err);
  // });
  // const fileBuff = fs.readFileSync(path.resolve('../eekhoorn-20190911.jpg'));
  // const filePut = await client.put('/vanMoosel Fotos/eekhoorn-20190911a.jpg', fileBuff);
  const details = await client.getFolderFileDetails('/vanMoosel Fotos/_uploads');
  console.log(details);
  // await client.downloadToStream('/vanMoosel Fotos/_uploads/IMG_0705.JPG', fs.createWriteStream(path.resolve('../IMG_0705.jpg'))).catch((err) => {
  //   console.log(err);
  // });
  // await client.downloadToStream('/vanMoosel Fotos/_uploads/DSC09550.ARW', fs.createWriteStream(path.resolve('../DSC09550.arw'))).catch((err) => {
  //   console.log(err);
  // });
  // const ctx = { flow: { fileInfo: null }};
  // await readExif(ctx, () => {});
  // await client.uploadFromStream('/vanMoosel Fotos/_uploads/IMG_0705.jpg', fs.createReadStream(path.resolve('../IMG_0705.jpg'))).catch((err) => {
  //   console.log(err);
  // });
  // const details1 = await client.getFolderFileDetails('/vanMoosel Fotos/_uploads');
  // console.log(details1);

  // console.log(ctx.flow.fileInfo);
  await next();
}

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
  const tempPath = path.resolve(`${tempFolder}/${path.basename(context.flow.file.path)}`);
  await client.downloadToStream(context.flow.file.path, fs.createWriteStream(tempPath)).catch((err) => {
    console.log(err);
  });
  context.flow.file.tempPath = tempPath;
  return await next();
}
