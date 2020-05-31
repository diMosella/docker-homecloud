'use strict';

import { EnumProperties, enumerate } from './enum.mjs';

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
  new EnumProperties('abigail', 'Abigail', '/Uploads/Abigail iPhoneSE'),
  new EnumProperties('wim', 'Wim', '/Uploads/Wim iPhoneSE'),
  new EnumProperties('sony', 'Sony', '/Uploads/Sony'),
  new EnumProperties('scan', 'Scan', '/Scans'),
  new EnumProperties('ext', 'Extern')
);

export const MONTH = enumerate('januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december');
