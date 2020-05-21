import { execFile } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(execFile);

const FIELD_TYPES = {
  string: 'string',
  boolean: 'boolean',
  number: 'number'
};

const FIELDMAP = {
  id: {
    label: 'Leerlingnummer',
    type: FIELD_TYPES.number
  },
  firstName: {
    label: 'Roepnaam',
    type: FIELD_TYPES.string
  },
  namePrefix: {
    label: 'Voorvoegsel',
    type: FIELD_TYPES.string
  },
  lastName: {
    label: 'Achternaam',
    type: FIELD_TYPES.string
  }
};

const FIELDMAP_REV = {};
Object.entries(FIELDMAP).map(entry => { FIELDMAP_REV[entry[1].label] = entry[0]; });

export const read = async (ctx, next) => {
  await next();
  let isError = false;
  const { stdout, stderr } = await asyncExec('exiftool', ['-j', '../eekhoorn-20190911.jpg']).catch(error => {
    console.log('error:', error);
    isError = true;
    return error;
  });
  // 'Creator': 'SKDD',
  // 'DateTimeOriginal': newTimestamp,
  // 'FileCreateDate': newTimestamp,
  // 'FileModifyDate': newTimestamp
  // console.log('stdout:', JSON.parse(stdout));
  // console.log('stderr:', stderr);
  ctx.flow.fileInfo = isError ? null : JSON.parse(stdout);
}
