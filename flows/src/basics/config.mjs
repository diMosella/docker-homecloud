'use strict';

import { SOURCE, FILE_CATEGORY } from './constants.mjs';

export const watch = [
  {
    frequency: '*/2 7-21 * * *',
    paths: [SOURCE.SONY, SOURCE.ABIGAIL, SOURCE.WIM, SOURCE.DIMOSELLA, SOURCE.ABIGAIL_SCAN, SOURCE.WIM_SCAN, SOURCE.DIMOSELLA_SCAN]
        .map((item) => SOURCE.properties[item].code)
  }
];

export const tempFolder = '/home/wim/temp';

export const basePaths = {
  [FILE_CATEGORY.properties[FILE_CATEGORY.MEDIA].value]: {
    org: '/vanMoosel Fotos/_originelenT',
    edit: '/vanMoosel Fotos/_edits'
  },
  [FILE_CATEGORY.properties[FILE_CATEGORY.DOCS].value]: {
    org: '/vanMoosel Scans/_originelen',
    edit: '/vanMoosel Scans'
  }
};
