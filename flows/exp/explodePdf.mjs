'use strict';

import fs from 'fs';
import polyfill from 'web-streams-polyfill/dist/ponyfill.es2018.js';
import Canvas from 'canvas';
import pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { enumerate } from '../basics/enum.mjs';

const { createWorker } = Tesseract;
const { createImageData, createCanvas } = Canvas;
global.ReadableStream = polyfill.ReadableStream;

// Some PDFs need external cmaps.
var CMAP_URL = '../../node_modules/pdfjs-dist/cmaps/';
var CMAP_PACKED = true;
const IMAGE_KIND = enumerate('none', 'grayscale_1bpp', 'rgb_24bpp', 'rgba_32bpp');

// Loading file from file system into typed array
var pdfPath = '/home/wim/temp/scan002.pdf';
var data = new Uint8Array(fs.readFileSync(pdfPath));

// Will be using promises to load document, pages and misc data instead of
// callback.
const start = async () => {
  const doc = await pdfjsLib.getDocument({
    data: data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    nativeImageDecoderSupport: 'none'
  }).promise;

  const numPages = doc.numPages;
  console.log('# Document Loaded');
  console.log('Number of Pages: ' + numPages);
  console.log();

  const worker = createWorker({
    langPath: './src/assets',
    gzip: false,
    logger: m => console.log(m)
  });
  await worker.load();
  await worker.loadLanguage('nld+eng');
  await worker.initialize('nld+eng');

  for (let pageNumber = 1; pageNumber <= 2; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    console.log('Size: ' + viewport.width + 'x' + viewport.height);
    console.log();
    const opList = await page.getOperatorList();
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.paintJpegXObject) { // OPS.paintImageXObject
        console.log(pageNumber, i, 'jpeg');
        // FIXME: allow this path as well
        // const imageInfo = page.objs.get(opList.argsArray[i][0]);
        // extractedImages.push(imageInfo._src.split('data:image/jpeg;base64,')[1]);
      }
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) { // OPS.paintImageXObject
        console.log(pageNumber, i, 'image');
      }
    }
    const imgIndex = opList.fnArray.indexOf(pdfjsLib.OPS.paintImageXObject);
    const [objId, width, height, kind] = opList.argsArray[imgIndex];
    console.log(objId, width, height, kind);
    const { data: imgData, width: imgWidth, height: imgHeight, kind: imgKind } = await page.objs.get(objId);
    console.log(imgWidth, imgHeight, imgKind, imgData.subarray(0, 9), imgData.length, imgHeight * imgWidth * 3);
    const image32 = new Uint8ClampedArray(imgWidth * imgHeight * 4);
    let addCount = 0;
    for (let index = 0; index < imgData.length; index++) {
      image32[index + addCount] = imgData[index];
      if ((index + 1) % 3 === 0) {
        image32[index + addCount + 1] = 255;
        addCount++;
      }
    }
    console.log(image32.subarray(0, 12));
    const imageData = createImageData(image32, imgWidth, imgHeight);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    const dcanvas = createCanvas(width, height);
    const dcontext = dcanvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    dcontext.scale(0.5, 0.5);
    dcontext.drawImage(canvas, 0, 0);
    const out = fs.createWriteStream('/home/wim/temp/test.png');
    const stream = dcanvas.createPNGStream({ compressionLevel: 9, resolution: 72 });
    stream.pipe(out);
    out.on('finish', () => console.log('The PNG file was created.'));
    const { data: { text } } = await worker.recognize(dcanvas.toBuffer());
    console.log(text);
    const { data } = await worker.getPDF('Tesseract OCR Result');
    fs.writeFileSync('/home/wim/temp/tesseract-ocr-result.pdf', Buffer.from(data));
    console.log('Generate PDF: tesseract-ocr-result.pdf');
  }
  await worker.terminate();
};

start();

// const loadPage = function (pageNum) {
//   return doc.getPage(pageNum).then(async function (page) {
//     console.log('# Page ' + pageNum);
//     var viewport = page.getViewport({ scale: 1.0 });
//     console.log('Size: ' + viewport.width + 'x' + viewport.height);
//     console.log();

//     const opList = await page.getOperatorList();
//     for (let i = 0; i < opList.fnArray.length; i++) {
//       if (opList.fnArray[i] === pdfjsLib.OPS.paintJpegXObject) { // OPS.paintImageXObject
//         console.log('jpeg');
//         // const imageInfo = page.objs.get(opList.argsArray[i][0]);
//         // extractedImages.push(imageInfo._src.split('data:image/jpeg;base64,')[1]);
//       }
//       if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) { // OPS.paintImageXObject
//         console.log('image');
//       }
//     }

// return page.getOperatorList().then(function (opList) {
//   for (let i = 0; i < opList.fnArray.length; i++) {
//     if (opList.fnArray[i] === pdfjsLib.OPS.paintJpegXObject) { // OPS.paintImageXObject
//       console.log('jpeg');
//       // const imageInfo = page.objs.get(opList.argsArray[i][0]);
//       // extractedImages.push(imageInfo._src.split('data:image/jpeg;base64,')[1]);
//     }
//     if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) { // OPS.paintImageXObject
//       console.log('image');
//     }
//   }
//   var svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
//   svgGfx.embedFonts = true;
//   return svgGfx.getSVG(opList, viewport).then(function (svg) {
//     return writeSvgToFile(svg, getFilePathForPage(pageNum)).then(
//       function () {
//         console.log('Page: ' + pageNum);
//       },
//       function (err) {
//         console.log('Error: ' + err);
//       }
//     );
//   });
// });
// });
//   };

//   for (var i = 1; i <= numPages; i++) {
//     lastPromise = lastPromise.then(loadPage.bind(null, i));
//   }
//   return lastPromise;
// })
// .then(
//   function () {
//     console.log('# End of Document');
//   },
//   function (err) {
//     console.error('Error: ' + err);
//   }
// );
