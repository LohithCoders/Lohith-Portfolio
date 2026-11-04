import {spawnSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';

const nextBin = 'node_modules/next/dist/bin/next';
const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
  stdio: 'inherit',
  env: {...process.env, NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-build'},
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const distDir=process.env.NEXT_DIST_DIR||'.next-build';
const standaloneDir=join(distDir,'standalone');
const assets=[
  [join(distDir,'static'),join(standaloneDir,distDir,'static')],
  ['public',join(standaloneDir,'public')],
];

for(const [source,target] of assets){
  if(!existsSync(source))continue;
  mkdirSync(dirname(target),{recursive:true});
  cpSync(source,target,{recursive:true,force:true});
}
