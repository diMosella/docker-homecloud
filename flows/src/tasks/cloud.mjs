'use strict';

import fs from 'fs';
import path from 'path';
import NextcloudClient from 'nextcloud-link';
import { cloud } from '../basics/credentials.mjs';

// Supply a configuration object to NextcloudClient to
// set-up the connection
const client = new NextcloudClient(cloud);

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
  const file = await client.getFiles('/vanMoosel Fotos').catch((err) => {
    console.log(err);
  });
  console.log('dir', file);
  await next();
}
