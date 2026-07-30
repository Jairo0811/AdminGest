import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const workspaces = ['@admingest/api', '@admingest/web'];
const children = workspaces.map((workspace) =>
  spawn(command, ['run', 'dev', '--workspace', workspace], {
    stdio: 'inherit',
    env: process.env,
  }),
);

function stop(signal) {
  for (const child of children) child.kill(signal);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stop('SIGTERM');
      process.exitCode = code;
    }
  });
}
