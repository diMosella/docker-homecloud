'use strict';

const { stdout: stdout1, stdout: stderr1 } = await asyncExec('convert', ['-auto-gamma', '-auto-level', '-normalize', '../eekhoorn-20190911.jpg', '../newSquirrel.jpg']).catch(error => {
  console.log('error:', error);
  return error;
});
console.log('stdout:', stdout1);
console.log('stderr:', stderr1);
