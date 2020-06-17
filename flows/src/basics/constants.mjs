'use strict';

import { EnumProperties, enumerate } from './enum.mjs';

const USERS = {
  A: 'Abigail',
  W: 'Wim',
  D: 'diMosella'
};

export const FILE_CATEGORY = enumerate('media', 'docs');

export const STATE = enumerate('validated', 'queued', 'locked', 'processed');
export const ACTION = enumerate (
  new EnumProperties('ping', 'ping to check alive'),
  new EnumProperties('add', 'add item to queue'),
  new EnumProperties('wait', 'wait to start queue'),
  new EnumProperties('start', 'start processing queue'),
  new EnumProperties('lock', 'lock queue item'),
  new EnumProperties('finish', 'finish processing queue item')
);

export const TIME_UNIT = enumerate(
  new EnumProperties('hour', 'hours', 'hh', 3600),
  new EnumProperties('minute', 'minutes', 'mm', 60),
  new EnumProperties('second', 'seconds', 'ss', 1)
);

export const CAMERA = enumerate(
  new EnumProperties('iPhone_SE', 'iPhone SE'),
  new EnumProperties('NEX_5T', 'NEX-5T'),
  new EnumProperties('M476dn', 'M476dn'),
  new EnumProperties('import', 'import')
);

export const SOURCE = enumerate(
  new EnumProperties(USERS.A, USERS.A, `/Uploads/${USERS.A} iPhoneSE`),
  new EnumProperties(USERS.W, USERS.W, `/Uploads/${USERS.W} iPhoneSE`),
  new EnumProperties(USERS.D, USERS.D, `/Uploads/${USERS.D}`),
  new EnumProperties('sony', 'Sony', '/Uploads/Sony'),
  new EnumProperties(`${USERS.A}-scan`, USERS.A, `/Scans/${USERS.A}`),
  new EnumProperties(`${USERS.W}-scan`, USERS.W, `/Scans/${USERS.W}`),
  new EnumProperties(`${USERS.D}-scan`, USERS.D, `/Scans/${USERS.D}`),
  new EnumProperties('ext', 'Extern')
);

export const MONTH = enumerate('januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december');
