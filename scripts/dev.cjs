// Generates in-memory credentials each start; nothing is saved to disk or the browser.
const {randomBytes}=require('node:crypto');
const {createServer}=require('../apps/api/server.cjs');
const users=['supervisor','planner','warehouse','compliance','auditor','driver'].map(role=>({id:`local-${role}`,name:role==='driver'?'Demo driver':role,role,depot:'NETLEY',token:randomBytes(32).toString('hex')}));
users.push({id:'local-driver-2',name:'Demo driver 2',role:'driver',depot:'NETLEY',token:randomBytes(32).toString('hex')});
const {server,freight,planning}=createServer({users,demo:true});
if(!freight.dashboard(users[0]).shipments.length){
 const fs=require('node:fs'),path=require('node:path');
 const body={format:'json',...JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/sample.json'),'utf8'))};
 const result=freight.importFreight(users[0],body,'demo-seed-import');
 freight.receive(users[0],{barcode:'SYN-P001',location:'NETLEY/FINGER-A',version:1},'demo-seed-scan');
 freight.reconcile(users[0],result.created[0],{version:2},'demo-seed-reconcile');
 freight.clearance(users.find(u=>u.role==='compliance'),result.created[0],{version:3,kind:'customs',action:'customer_delivery',status:'HOLD',authority:'Synthetic demonstration authority',evidence:'SYN-HOLD-001'},'demo-seed-hold');
}
if(!planning.board(users[0]).runs.length){
 const day=new Date().toISOString().slice(0,10),dueAt=day+'T23:59:00Z';
 const shipments=[['SYN-RUN-101','SYN-R101','5037','Synthetic stop · Netley',-34.947,138.551],['SYN-RUN-102','SYN-R102','5037','Synthetic stop · Kurralta Park',-34.951,138.565],['SYN-RUN-103','SYN-R103','5038','Synthetic stop · Plympton',-34.961,138.555]].map(([reference,barcode,postcode,destination,lat,lon])=>({reference,synthetic:true,postcode,destination,coordinates:{lat,lon},addressVerified:true,dueAt,pieces:[{barcode,weightKg:5,lengthCm:30,widthCm:25,heightCm:20}]}));
 const result=freight.importFreight(users[0],{format:'json',shipments},'demo-run-parcels');
 for(const s of shipments)freight.receive(users[0],{barcode:s.pieces[0].barcode,location:'NETLEY/RECEIVING',version:1},'demo-run-receive-'+s.reference);
 const r=planning.create(users[0],{name:'Netley demo run',finger:1,cycle:'A',operatingDate:day,driverId:'local-driver',postcodes:['5037','5038'],capacityKg:800,capacityM3:8,startAt:day+'T00:00:00Z',endAt:day+'T23:59:00Z',depotLat:-34.948,depotLon:138.548},'demo-run-create');
 planning.auto(users[0],{},'demo-run-allocate');
 planning.send(users[0],r.id,{version:planning.detail(users[0],r.id).version,rehearsal:true},'demo-run-send');
}
server.on('error',error=>{
 freight.close();
 if(error.code==='EADDRINUSE')console.error('Port 4300 is already in use. If IFOROS is already running, open http://127.0.0.1:4300. Otherwise stop the application using that port and run npm run dev again.');
 else console.error('IFOROS could not start:',error.message);
 process.exitCode=1;
});
server.listen(4300,'127.0.0.1',()=>{console.log('IFOROS synthetic development workspace: http://127.0.0.1:4300');console.log('Open the page and select a synthetic demo role. Credentials are ephemeral and stay in server/browser memory.');console.log('Keep this terminal open. Press Ctrl+C to stop the server.');});
