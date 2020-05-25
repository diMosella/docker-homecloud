'use strict';

import { EnumProperties, enumerate } from './enum.mjs';

export const STATE = enumerate('validated', 'queued', 'locked', 'processed');
export const ACTION = enumerate (
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
