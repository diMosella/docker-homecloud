'use strict';

import http from 'http';

const options = {
  host: 'localhost',
  port : '8000',
  timeout : 2000
};

const request = http.request(options, (response) => {
  if (response.statusCode === 200 && response.body && response.body.success === true) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (_error) => {
  process.exit(1);
});

request.end();
