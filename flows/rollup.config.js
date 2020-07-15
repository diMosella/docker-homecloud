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
        './src/services/soloWorkerProcess.mjs': './dist/soloWorker.mjs',
        './src/services/serverWorkerProcess.mjs': './dist/serverWorker.mjs',
        './src/services/converterWorkerProcess.mjs': './dist/converterWorker.mjs',
        delimiters: ['', '']
      }),
      json(), resolve({ preferBuiltins: true }), commonjs()]
  },
  {
    input: 'src/services/soloWorkerProcess.mjs',
    output: {
      file: path.resolve(__dirname, 'dist', 'soloWorker.mjs'),
      format: 'es'
    },
    external: [
      'path', 'fs', 'cluster', 'child_process', 'util', 'url', 'events',
      'querystring', 'crypto', 'http', 'https', 'stream', 'net', 'tls',
      'zlib', 'buffer', 'assert', 'string_decoder', 'punycode'
    ],
    plugins: [
      replace({
        'util.inherits(PrivateKey, Key);': 'setTimeout(() => { util.inherits(PrivateKey, Key); });',
        delimiters: ['', '']
      }),
      json(), resolve({ preferBuiltins: true }), commonjs()
    ]
  },
  {
    input: 'src/services/serverWorkerProcess.mjs',
    output: {
      file: path.resolve(__dirname, 'dist', 'serverWorker.mjs'),
      format: 'es'
    },
    external: [
      'path', 'fs', 'cluster', 'child_process', 'util', 'url', 'events',
      'crypto', 'http', 'stream', 'net', 'tty', 'constants', 'assert',
      'querystring', 'buffer', 'os'
    ],
    plugins: [
      replace({
        'require(\'readable-stream/transform\')': 'require(\'stream\').Transform',
        'require("readable-stream/transform")': 'require("stream").Transform',
        'readable-stream': 'stream',
        delimiters: ['', '']
      }),
      json(), resolve({ preferBuiltins: true }), commonjs()]
  },
  {
    input: 'src/services/converterWorkerProcess.mjs',
    output: {
      file: path.resolve(__dirname, 'dist', 'converterWorker.mjs'),
      format: 'es'
    },
    external: [
      'path', 'fs', 'cluster', 'child_process', 'util', 'assert', 'net',
      'crypto', 'url', 'stream', 'querystring', 'http', 'https', 'buffer',
      'tls', 'string_decoder', 'zlib', 'events', 'punycode'
    ],
    plugins: [
      replace({
        'util.inherits(PrivateKey, Key);': 'setTimeout(() => { util.inherits(PrivateKey, Key); });',
        delimiters: ['', '']
      }),
      json(), resolve({ preferBuiltins: true }), commonjs()
    ]
  }
];
