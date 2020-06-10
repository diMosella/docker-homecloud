'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { tempFolder } from '../basics/config.mjs';

const asyncExec = promisify(execFile);

export const convert = async (context) => {
  if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathOrg !== 'string') {
    throw new TypeError('A context temp path must be of type string!');
  }

  const { tempPathOrg, derived } = context.flow.file;
  const { nameEdit } = derived;

  const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

  const options = [ '--rotate-pages', '--deskew', '-l', 'nld+eng', '--clean' ];

  let isError = false;
  await asyncExec('ocrmypdf',
      [ ...options, path.resolve(tempPathOrg), tempPathEdit ]
  ).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });

  if (isError) {
    return;
  }
  context.flow.file.tempPathEdit = tempPathEdit;
};

// let isInitialized = false;

// let worker;

// const init = async () => {
//   if (!worker) {
//     worker = createWorker({
//       langPath: tempFolder,
//       gzip: false,
//       logger: m => console.log(m)
//     });
//   }
//   await worker.load();
//   await worker.loadLanguage('nld+eng');
//   await worker.initialize('nld+eng');
//   isInitialized = true;
// };

// export const convert = async (context) => {
//   if (typeof context.flow === 'undefined' || typeof context.flow.file === 'undefined' || typeof context.flow.file.tempPathIntermediate !== 'string') {
//     throw new TypeError('A context temp path must be of type string!');
//   }

//   const { tempPathIntermediate, derived } = context.flow.file;
//   const { nameEdit } = derived;

//   const tempPathEdit = path.resolve(`${tempFolder}/${nameEdit}`);

//   if (!worker || !isInitialized) {
//     await init();
//   }

//   const { data: { text } } = await worker.recognize(path.resolve(tempPathIntermediate));
//   console.log(text);
//   const { data } = await worker.getPDF('Tesseract OCR');

//   let isError = false;
//   await asyncWrite(tempPathEdit, Buffer.from(data)).catch((error) => {
//     console.log('error', error);
//     isError = true;
//   });

//   if (tempPathIntermediate) {
//     fs.unlink(path.resolve(tempPathIntermediate), (err) => {
//       if (err) throw err;
//     });
//   }

//   if (isError) {
//     return;
//   }

//   console.log(`Generated PDF: ${tempPathEdit}`);
