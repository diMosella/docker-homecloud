'use strict';

import { SOURCE, FILE_CATEGORY } from './constants.mjs';

/**
 * Cron configuration: frequency and locations to watch
 */
export const watch = [
  {
    frequency: '*/6 7-21 * * *',
    locations: [
      SOURCE.SONY, SOURCE.ABIGAIL, SOURCE.WIM, SOURCE.DIMOSELLA, SOURCE.OPVANG, SOURCE.SCHOOL,
      SOURCE.E_MAIL, SOURCE.ABIGAIL_SCAN, SOURCE.WIM_SCAN, SOURCE.DIMOSELLA_SCAN
    ].map((item) => SOURCE.getProperty(item, 'code'))
  }
];

/**
 * Place to temporarily store intermediate files necessary for processing
 */
export const tempFolder = process.env.CLOUD_TEMP || '/temp';

/**
 * Location to publish processed files
 */
export const basePaths = {
  [FILE_CATEGORY.getProperty(FILE_CATEGORY.MEDIA, 'value')]: {
    org: '/vanMoosel Fotos/_originelen',
    edit: '/vanMoosel Fotos'
  },
  [FILE_CATEGORY.getProperty(FILE_CATEGORY.DOCS, 'value')]: {
    org: '/vanMoosel Scans/_originelen',
    edit: '/vanMoosel Scans'
  }
};
