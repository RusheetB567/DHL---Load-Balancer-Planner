// Generates in-memory credentials each start; nothing is saved to disk or the browser.
const {randomBytes}=require('node:crypto');
const {createServer}=require('../apps/api/server.cjs');
const users=['supervisor','planner','warehouse','compliance','auditor'].map(role=>({id:`local-${role}`,role,depot:'NETLEY',token:randomBytes(32).toString('hex')}));
const {server,freight}=createServer({users,demo:true});
if(!freight.dashboard(users[0]).shipments.length){
 const fs=require('node:fs'),path=require('node:path');
 const body={format:'json',...JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/sample.json'),'utf8'))};
 const result=freight.importFreight(users[0],body,'demo-seed-import');
 freight.receive(users[0],{barcode:'SYN-P001',location:'NETLEY/FINGER-A',version:1},'demo-seed-scan');
 freight.reconcile(users[0],result.created[0],{version:2},'demo-seed-reconcile');
 freight.clearance(users.find(u=>u.role==='compliance'),result.created[0],{version:3,kind:'customs',action:'customer_delivery',status:'HOLD',authority:'Synthetic demonstration authority',evidence:'SYN-HOLD-001'},'demo-seed-hold');
}
server.listen(4300,'127.0.0.1',()=>{console.log('IFOROS synthetic development workspace: http://127.0.0.1:4300');console.log('Open the page and select a synthetic demo role. Credentials are ephemeral and stay in server/browser memory.');});
