import { spawn } from 'node:child_process';

const processes = [
  spawn('npm', ['run', 'dev', '--workspace', '@admingest/api'], {
    shell: true,
    stdio: 'inherit',
  }),
  spawn('npm', ['run', 'dev', '--workspace', '@admingest/web'], {
    shell: true,
    stdio: 'inherit',
  }),
];

const stop = () => {
  for (const process of processes) {
    process.kill('SIGTERM');
  }
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

await Promise.race(
  processes.map(
    (process) =>
      new Promise((resolve) => {
        process.on('exit', resolve);
      }),
  ),
);

stop();
