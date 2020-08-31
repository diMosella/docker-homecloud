'use strict';

import { EnumProperties, enumerate } from './enum.mjs';

const USERS = {
  A: 'Abigail',
  W: 'Wim',
  D: 'diMosella'
};

export const { instance: FILE_CATEGORY, class: FileCategoryEnum } = enumerate('media', 'docs');

export const { instance: LOG_LEVEL, class: LogLevelEnum } = enumerate(
  new EnumProperties('error', 'error'),
  new EnumProperties('warn', 'warn'),
  new EnumProperties('info', 'info'),
  new EnumProperties('debug', 'debug')
);

export const { instance: ENVIRONMENT, class: EnvironmentEnum } = enumerate(
  new EnumProperties('production', 'production'),
  new EnumProperties('test', 'test'),
  new EnumProperties('development', 'development')
);

const isTest = process.env.NODE_ENV === ENVIRONMENT.getProperty(ENVIRONMENT.TEST, 'label');

export const { instance: WORKER_TYPE, class: WorkerTypeEnum } = enumerate(
  new EnumProperties('server', 'web server worker', !isTest
    ? './src/services/serverWorkerProcess.mjs'
    : './src/services/worker.spec.sidecar.mjs'),
  new EnumProperties('solo', 'singleton, sequential worker', !isTest
    ? './src/services/soloWorkerProcess.mjs'
    : './src/services/worker.spec.sidecar.mjs'),
  new EnumProperties('converter', 'converting data worker', !isTest
    ? './src/services/converterWorkerProcess.mjs'
    : './src/services/worker.spec.sidecar.mjs')
);

export const { instance: STATE, class: StateEnum } = enumerate('queued', 'locked', 'processed');
export const { instance: ACTION, class: ActionEnum } = enumerate(
  new EnumProperties('ping', 'ping to check being alive'),
  new EnumProperties('pong', 'pong to confirm being alive'),
  new EnumProperties('available', 'to confirm being available'),
  new EnumProperties('queue_add', 'add item to queue'),
  new EnumProperties('queue_process', 'process queue'),
  new EnumProperties('queue_get', 'get next queue item'),
  new EnumProperties('queue_got', 'got next queue item'),
  new EnumProperties('queue_lock', 'lock queue item'),
  new EnumProperties('queue_finish', 'finish queue item processing'),
  new EnumProperties('queue_final', 'queue is final, completely processed'),
  new EnumProperties('cache_get', 'get path value from cache'),
  new EnumProperties('cache_got', 'got path value from cache'),
  new EnumProperties('cache_set', 'set path value in cache'),
  new EnumProperties('cache_listen', 'listen for a path to be set in cache'),
  new EnumProperties('cache_heard', 'heard path being set in cache')
);

export const { instance: TIME_UNIT, class: TimeUnitEnum } = enumerate(
  new EnumProperties('hour', 'hours', 'hh', 3600),
  new EnumProperties('minute', 'minutes', 'mm', 60),
  new EnumProperties('second', 'seconds', 'ss', 1)
);

export const { instance: CAMERA, class: CameraEnum } = enumerate(
  new EnumProperties('iPhone_SE', 'iPhone SE'),
  new EnumProperties('NEX_5T', 'NEX-5T'),
  new EnumProperties('M476dn', 'M476dn'),
  new EnumProperties('import', 'import')
);

export const { instance: SOURCE, class: SourceEnum } = enumerate(
  new EnumProperties(USERS.A, USERS.A, `/Uploads/${USERS.A} iPhoneSE`),
  new EnumProperties(USERS.W, USERS.W, `/Uploads/${USERS.W} iPhoneSE`),
  new EnumProperties(USERS.D, USERS.D, `/Uploads/${USERS.D}`),
  new EnumProperties('sony', 'Sony', '/Uploads/Sony'),
  new EnumProperties('opvang', 'via Opvang', '/Uploads/via Opvang'),
  new EnumProperties('school', 'via School', '/Uploads/via School'),
  new EnumProperties('e_mail', 'via E-mail', '/Uploads/via E-mail'),
  new EnumProperties(`${USERS.A}-scan`, USERS.A, `/Scans/${USERS.A}`),
  new EnumProperties(`${USERS.W}-scan`, USERS.W, `/Scans/${USERS.W}`),
  new EnumProperties(`${USERS.D}-scan`, USERS.D, `/Scans/${USERS.D}`),
  new EnumProperties('ext', 'Extern')
);

export const { instance: MONTH, class: MonthEnum } = enumerate(
  'januari', 'februari', 'maart',
  'april', 'mei', 'juni',
  'juli', 'augustus', 'september',
  'oktober', 'november', 'december'
);

export const RETRY_MAX_COUNT = 3;
export const RETRY_DELAY = !isTest ? 10 : 0.1;
export const QUEUE_DELAY = !isTest ? 10 : 0.1;
