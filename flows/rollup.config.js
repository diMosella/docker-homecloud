'use strict';

import path from 'path';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

export default [
  {
    input: 'src/app.mjs',
    output: {
      file: path.resolve(__dirname, 'dist', 'flows.mjs'),
      format: 'es'
    },
    external: ['os', 'cluster', 'child_process'],
    plugins: [
      replace({
        // './src/services/serverWorkerProcess.mjs': './dist/serverWorker.mjs',
        './src/services/converterWorkerProcess.mjs': './dist/converterWorker.mjs',
        // './src/services/soloWorkerProcess.mjs': './dist/soloWorker.mjs',
        delimiters: ['', '']
      }),
      json(), resolve({ preferBuiltins: true }), commonjs()]
  },
  // {
  //   input: 'src/services/soloWorkerProcess.mjs',
  //   output: {
  //     file: path.resolve(__dirname, 'dist', 'soloWorker.mjs'),
  //     format: 'es'
  //   },
  //   external: [
  //     'path', 'fs', 'cluster', 'child_process', 'util',
  //     'crypto', 'http', 'https', 'stream', 'net', 'tls', 'zlib'
  //   ],
  //   plugins: [json(), resolve({ preferBuiltins: true }), commonjs()]
  // },
  // {
  //   input: 'src/services/serverWorkerProcess.mjs',
  //   output: {
  //     file: path.resolve(__dirname, 'dist', 'serverWorker.mjs'),
  //     format: 'es'
  //   },
  //   external: [
  //     'path', 'fs', 'cluster', 'child_process', 'util',
  //     'crypto', 'http', 'stream', 'net', 'tty', 'constants'
  //   ],
  //   plugins: [json(), resolve({ preferBuiltins: true }), commonjs()]
  // },
  // {
  //   input: 'src/services/converterWorkerProcess.mjs',
  //   output: {
  //     file: path.resolve(__dirname, 'dist', 'converterWorker.mjs'),
  //     format: 'es'
  //   },
  //   external: [
  //     'path', 'fs', 'cluster', 'child_process',
  //     'crypto', 'http', 'https', 'stream', 'net', 'tls', 'zlib'
  //   ],
  //   plugins: [json(), resolve({ preferBuiltins: false }), commonjs()]
  // }
];
