// Start a persistent, loopback-only development preview without a terminal dependency.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.join(__dirname,'..'),url='http://127.0.0.1:4300';
async function status(){try{const r=await fetch(url+'/api/health',{signal:AbortSignal.timeout(1200)});if(!r.ok)return 'occupied';const data=await r.json();return data.service==='iforos'&&data.ready===true?'ready':'occupied';}catch(error){if(error.cause?.code==='ECONNREFUSED')return 'offline';return 'unknown';}}
async function main(){
 const initial=await status();if(initial==='ready'){console.log('IFOROS preview is already running: '+url);return;}
 if(initial!=='offline')throw Error('Port 4300 did not return a healthy IFOROS response. Check the existing service before starting another preview.');
 const folder=path.join(root,'.data');fs.mkdirSync(folder,{recursive:true});const logFile=path.join(folder,'preview.log'),log=fs.openSync(logFile,'a');
 let child;try{child=spawn(process.execPath,[path.join(__dirname,'dev.cjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log,log]});}finally{fs.closeSync(log);}
 let spawnError;child.on('error',error=>{spawnError=error;});child.unref();
 for(let i=0;i<40;i++){if(spawnError)throw spawnError;await new Promise(resolve=>setTimeout(resolve,300));if(await status()==='ready'){console.log('IFOROS preview is ready: '+url);console.log('Runs in the background. Startup log: '+logFile);return;}}
 throw Error('Preview did not become ready. See '+logFile+' for the startup error.');
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={status};
