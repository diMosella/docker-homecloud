import { cpus } from 'os';
import { execFile } from 'child_process';
import cluster from 'cluster';
import { promisify } from 'util';
import path from 'path';
import { read } from './exif.mjs';

import serve from 'koa-static';
import Koa from 'koa';

const __dirname = path.resolve();
const asyncExec = promisify(execFile);

if(cluster.isMaster) {
  const numWorkers = cpus().length;

  console.log('Master cluster setting up ' + numWorkers + ' workers...');

  for(var i = 0; i < numWorkers; i++) {
      cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', (worker, code, signal) => {
      console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
      console.log('Starting a new worker');
      cluster.fork();
  });

} else {
  const app = new Koa();
  const port = 8000;
  const docroot = path.join(__dirname, '../');

  app.context.flow = {
    fileInfo: null
  };

  // logger
  app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
    console.log(`from worker ${cluster.worker.process.pid}`);
    console.log('fileInfo', ctx.flow.fileInfo);

    const { stdout: stdout1, stdout: stderr1 } = await asyncExec('convert', ['-auto-gamma', '-auto-level', '-normalize', '../eekhoorn-20190911.jpg', '../newSquirrel.jpg']).catch(error => {
      console.log('error:', error);
      return error;
    });
    console.log('stdout:', stdout1);
    console.log('stderr:', stderr1);

    const { stdout: stdout2, stderr: stderr2 } = await asyncExec('exiftool', ['-j', '../newSquirrel.jpg']).catch(error => {
      console.log('error:', error);
      return error;
    });
    console.log('stdout:', stdout2);
    console.log('stderr:', stderr2);
  });

  app.use(read);

  // x-response-time
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
  });

  // response
  app.use(serve(docroot));
  // app.use(async ctx => {
  //   ctx.body = 'Hello World';
  // });

  app.listen(port, () => {
    console.log('Flows listening on port %s.', port);
  });
}

const promiseFromChildProcess = (childProcess) => {
  return new Promise((resolve, reject) => {
    childProcess.addListener('error', (code, signal) => {
      console.log('ChildProcess error', code, signal);
      reject();
    });
    childProcess.addListener('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

/* const yourscript = exec('sh hi.sh',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });

  */


// convert -auto-gamma -auto-level -normalize original.jpg improved.jpg

// dvdjs > webm
