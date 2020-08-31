'use strict';

export const cloud = {
  username: process.env.CLOUD_USER || '',
  password: process.env.CLOUD_PWD || '',
  url: process.env.CLOUD_URL || ''
};
