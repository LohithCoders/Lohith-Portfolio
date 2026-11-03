import {spawnSync} from 'node:child_process';

const nextBin = 'node_modules/next/dist/bin/next';
const result = spawnSync(process.execPath, [nextBin, 'dev', '--webpack', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {...process.env, NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-dev'},
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
