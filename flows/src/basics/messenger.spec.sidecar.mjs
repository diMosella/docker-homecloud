import messenger from './messenger.mjs';
// import { TIME_UNIT } from '../basics/constants.mjs';

const init = async () => {
  process.on('message', (msg) => {
    const { type } = msg;
    if (type === 'response') {
      process.send({ type });
    }
  });
  const transporter = messenger({ type: 'request' });
  process.send({ type: 'type', value: typeof transporter, isPromise: transporter instanceof Promise });
  await transporter;
  process.send({ type: 'final' });
};

init();
