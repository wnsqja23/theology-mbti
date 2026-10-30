import {spawnSync} from 'node:child_process';
for(const command of [['node_modules/typescript/bin/tsc','-b'],['node_modules/vite/bin/vite.js','build']]){
 const result=spawnSync(process.execPath,command,{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
await import('../server/index.mjs');
