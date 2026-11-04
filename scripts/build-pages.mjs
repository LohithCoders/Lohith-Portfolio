import {spawnSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';

const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{
  stdio:'inherit',
  env:{...process.env,GITHUB_PAGES:'true'},
});

if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
if(!existsSync('out/index.html')||!existsSync('out/404.html'))throw new Error('Static export is missing the home page or not-found page.');
writeFileSync('out/.nojekyll','');
