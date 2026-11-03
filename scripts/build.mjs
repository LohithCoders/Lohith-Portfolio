import {spawnSync} from 'node:child_process';

const nextBin = 'node_modules/next/dist/bin/next';
const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
  stdio: 'inherit',
  env: {...process.env, NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-build'},
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
