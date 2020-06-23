'use strict';

import { SOURCE, FILE_CATEGORY } from './constants.mjs';

/**
 * Cron configuration: frequency and paths to watch
 */
export const watch = [
  {
    frequency: '*/2 7-21 * * *',
    paths: [SOURCE.SONY, SOURCE.ABIGAIL, SOURCE.WIM, SOURCE.DIMOSELLA, SOURCE.ABIGAIL_SCAN, SOURCE.WIM_SCAN, SOURCE.DIMOSELLA_SCAN]
      .map((item) => SOURCE.properties[item].code)
  }
];

/**
 * Place to temporarily store intermediate files necessary for processing
 */
export const tempFolder = '/home/wim/temp';

/**
 * Location to publish processed files
 */
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
