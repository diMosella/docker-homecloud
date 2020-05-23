import sleep, { TIME_UNIT } from './sleep.mjs';

const test = async () => {
  console.log('Before', Date.now());
  await sleep(1, TIME_UNIT.MINUTE);
  console.log('After', Date.now());
}

test();
