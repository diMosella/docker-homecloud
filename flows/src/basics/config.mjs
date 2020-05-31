'use strict';

import { SOURCE } from './constants.mjs';

export const watch = [
  {
    frequency: '*/2 7-21 * * *',
    paths: [SOURCE.SONY, SOURCE.ABIGAIL, SOURCE.WIM, SOURCE.SCAN].map((item) => SOURCE.properties[item].code)
  }
];

export const tempFolder = '/home/wim/temp';

export const basePaths = {
  org: '/vanMoosel Fotos/_originelen',
  edit: '/vanMoosel Fotos'
};
