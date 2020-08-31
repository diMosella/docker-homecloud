'use strict';

import http from 'http';

const options = {
  host: 'localhost',
  port: '8000',
  method: 'GET',
  path: '/status',
  timeout: 2000
};

const request = http.request(options, (response) => {
  if (response.statusCode === 200) {
    let rawData = '';
    response.on('data', (chunk) => { rawData += chunk; });
    response.on('end', () => {
      try {
        const body = JSON.parse(rawData);
        console.log(body);
        if (body && body.success === true) {
          process.exit(0);
        }
        process.exit(1);
      } catch (_error) {
        process.exit(1);
      }
    });
  } else {
    process.exit(1);
  }
});

request.on('error', (_error) => {
  process.exit(1);
});

request.end();
