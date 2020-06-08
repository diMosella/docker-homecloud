'use strict';

import { execFile } from 'child_process';
import { promisify } from 'util';
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

  // let isError = false;
  // const { stdout, stderr } = await asyncExec('convert',
  //     ['-auto-gamma', '-auto-level', '-normalize', path.resolve(tempPathOrg), tempPathEdit]
  // ).catch(error => {
  //   console.log('error:', error);
  //   isError = true;
  //   return error;
  // });
  // context.flow.file.tempPathEdit = tempPathEdit;
};

// const path = require('path');
// const fs = require('fs');
// const { createWorker } = require('../../');

// const [,, imagePath] = process.argv;
// const image = path.resolve(__dirname, (imagePath || '../../tests/assets/images/cosmic.png'));

// console.log(`Recognizing ${image}`);

// (async () => {
//   const worker = createWorker();
//   await worker.load();
//   await worker.loadLanguage('eng');
//   await worker.initialize('eng');
//   const { data: { text } } = await worker.recognize(image);
//   console.log(text);
//   const { data } = await worker.getPDF('Tesseract OCR Result');
//   fs.writeFileSync('tesseract-ocr-result.pdf', Buffer.from(data));
//   console.log('Generate PDF: tesseract-ocr-result.pdf');
//   await worker.terminate();
// })();
