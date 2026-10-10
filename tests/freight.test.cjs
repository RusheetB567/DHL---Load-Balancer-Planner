const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createFreight,parseCSV}=require('../apps/api/freight.cjs');
const {createServer}=require('../apps/api/server.cjs');
const {randomUUID}=require('node:crypto');
const user=(role='supervisor',depot='NETLEY')=>({id:role,depot,role});
const fixture=()=>({format:'json',shipments:[{reference:'TEST-001',dueAt:'2026-10-10T17:00:00+10:30',pieces:[{barcode:'P1',weightKg:85,lengthCm:120,widthCm:80,heightCm:95},{barcode:'P2',weightKg:15,lengthCm:50,widthCm:50,heightCm:50}]}]});
const fails=(fn,code)=>assert.throws(fn,e=>e.code===code);
test('complete import → receiving → discrepancy → hold → persistence workflow',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'iforos-')),file=path.join(dir,'test.sqlite');let f=createFreight(file);try{
  const u=user(),body=fixture(),key=randomUUID();const r=f.importFreight(u,body,key),id=r.created[0];assert.equal(f.importFreight(u,body,key).created[0],id);assert.equal(f.importFreight(u,body,randomUUID()).duplicates.length,1);
  let s=f.detail(u,id);assert.equal(s.totals.weightKg,100);assert.equal(s.totals.volumeM3,1.037);assert.equal(s.totals.received,0);assert.equal(s.eligibility.eligible,false);
  const scan={barcode:'P1',location:'NETLEY/FINGER-A',version:1},scanKey=randomUUID();s=f.receive(user('warehouse'),scan,scanKey);assert.equal(s.version,2);assert.equal(f.receive(user('warehouse'),scan,scanKey).version,2);
  assert.equal(f.receive(user('warehouse'),scan,randomUUID()).rejected,'DUPLICATE_SCAN');assert.equal(f.detail(u,id).version,2);
  const rec=f.reconcile(u,id,{version:2},randomUUID());assert.deepEqual(rec.missing,['P2']);assert.equal(rec.version,3);
  s=f.clearance(user('compliance'),id,{version:3,kind:'customs',action:'customer_delivery',status:'HOLD',authority:'Synthetic authority',evidence:'Synthetic ref'},randomUUID());assert.equal(s.version,4);
  assert.equal(f.dashboard(u).metrics.held,1);assert.equal(f.dashboard(u).metrics.missingPieces,1);assert.equal(f.dashboard(u).metrics.receivedPieces,1);
  assert.ok(s.eligibility.reasons.includes('customs: HOLD'));assert.ok(!f.eligibility(u,id,'airport_transfer').reasons.includes('customs: HOLD'));
  assert.ok(f.audit(u).some(e=>e.action==='receiving.duplicate'));assert.throws(()=>f.db.prepare("DELETE FROM events").run(),/immutable/);
  f.close();f=createFreight(file);assert.equal(f.detail(u,id).totals.received,1);
  f.receive(u,{barcode:'P2',location:'NETLEY/RECEIVING',version:4},randomUUID());assert.equal(f.dashboard(u).exceptions.find(e=>e.kind==='MISSING_PIECES').state,'RESOLVED');assert.equal(f.dashboard(u).metrics.eligible,0);
 }finally{f.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('imports rollback on barcode conflicts; grouped cargo and contradictory CSV fail closed',()=>{
 const f=createFreight();try{const b=fixture();b.shipments.push({...b.shipments[0],reference:'SECOND'});fails(()=>f.importFreight(user(),b,randomUUID()),'BARCODE_EXISTS');assert.equal(f.dashboard(user()).shipments.length,0);
  const cis={format:'cisdriver3',items:[{id:'cargo-1',data:{consignmentNumber:'CIS-1',mawb:'081-12345678',customsStatus:'CLEARED',releaseStatus:'RELEASED'},dueAt:'2026-10-10T17:00:00+10:30',packages:[{barcode:'C1',count:2,weight_kg:5,length_cm:10,width_cm:10,height_cm:10}]}]};
  fails(()=>f.importFreight(user(),cis,randomUUID()),'PIECE_IDENTITY_REQUIRED');cis.items[0].packages[0].count=1;const id=f.importFreight(user(),cis,randomUUID()).created[0],s=f.detail(user(),id);assert.equal(s.clearances.length,0);assert.equal(s.eligibility.eligible,false);assert.equal(s.data.sourceId,'cargo-1');
  const csv={format:'csv',content:'reference,dueAt,barcode,weightKg,lengthCm,widthCm,heightCm\nA,2026-10-10T17:00:00Z,C2,1,1,1,1\nA,2026-10-11T17:00:00Z,C3,1,1,1,1'};fails(()=>f.importFreight(user(),csv,randomUUID()),'SHIPMENT_CONFLICT');
 }finally{f.close();}
});
test('stale edits, cross-depot access, role restrictions and idempotency conflicts',()=>{
 const f=createFreight();try{const b=fixture(),key=randomUUID(),id=f.importFreight(user(),b,key).created[0];fails(()=>f.detail(user('supervisor','OTHER'),id),'NOT_FOUND');assert.equal(f.dashboard(user('auditor','OTHER')).shipments.length,0);
  fails(()=>f.importFreight(user('warehouse'),b,randomUUID()),'FORBIDDEN');fails(()=>f.clearance(user(),id,{},randomUUID()),'FORBIDDEN');
  fails(()=>f.receive(user(),{barcode:'P1',location:'NETLEY/STAGING',version:99},randomUUID()),'VERSION_CONFLICT');assert.equal(f.detail(user(),id).totals.received,0);
  fails(()=>f.importFreight(user(),{...b,unused:true},key),'IDEMPOTENCY_CONFLICT');assert.equal(f.receive(user(),{barcode:'UNKNOWN',location:'NETLEY/RECEIVING',version:1},randomUUID()).rejected,'UNKNOWN_BARCODE');assert.equal(f.dashboard(user()).exceptions.length,1);
 }finally{f.close();}
});
test('CSV quoted fields and all invalid measurements/timestamps are rejected',()=>{
 assert.equal(parseCSV('a,b\r\n"x,y","z""q"')[0].a,'x,y');assert.equal(parseCSV('a,b\n"multi\nline",2')[0].a,'multi\nline');fails(()=>parseCSV('a,b\n"oops,2'),'INVALID_CSV');
 const f=createFreight();try{let b=fixture();b.shipments[0].pieces[0].lengthCm=-1;fails(()=>f.importFreight(user(),b,randomUUID()),'INVALID_INPUT');b=fixture();b.shipments[0].dueAt='tomorrow';fails(()=>f.importFreight(user(),b,randomUUID()),'INVALID_TIME');}finally{f.close();}
});
test('HTTP authorization, role denial, origin control, file import and replay',async()=>{
 const tokens={supervisor:'s'.repeat(40),auditor:'a'.repeat(40)};const {server,freight}=createServer({filename:':memory:',users:Object.entries(tokens).map(([role,token])=>({...user(role),token}))});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const call=(p,body,role='supervisor',extra={})=>fetch(base+'/api/v1'+p,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+tokens[role],'Content-Type':'application/json','Idempotency-Key':randomUUID(),...extra},...(body?{body:JSON.stringify(body)}:{})});
 try{assert.equal((await fetch(base+'/api/v1/dashboard')).status,401);assert.equal((await call('/imports',fixture(),'auditor')).status,403);assert.equal((await call('/imports',fixture(),'supervisor',{Origin:'http://evil.example'})).status,403);
  const key=randomUUID();let r=await call('/imports',fixture(),'supervisor',{'Idempotency-Key':key});assert.equal(r.status,200);const result=await r.json();r=await call('/imports',fixture(),'supervisor',{'Idempotency-Key':key});assert.deepEqual(await r.json(),result);
  assert.equal((await call('/dashboard')).headers.get('x-content-type-options'),'nosniff');assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/../package.json')).status,404);
 }finally{await new Promise(r=>server.close(r));freight.close();}
});
test('real CSV file import groups pieces and refuses absent weight',()=>{
 const f=createFreight();try{const content=fs.readFileSync(path.join(__dirname,'../apps/web/sample.csv'),'utf8');const id=f.importFreight(user(),{format:'csv',content},randomUUID()).created[0];assert.equal(f.detail(user(),id).totals.pieces,2);assert.equal(f.detail(user(),id).totals.weightKg,100);
  fails(()=>f.importFreight(user(),{format:'csv',content:content.replace('SYN-C001,85,','SYN-C001,,')},randomUUID()),'INVALID_INPUT');
 }finally{f.close();}
});
test('latest decisions keep independent kinds and expired decisions block',()=>{
 const f=createFreight();try{const id=f.importFreight(user(),fixture(),randomUUID()).created[0];let version=1;
  const decide=(kind,status,expiresAt)=>{const r=f.clearance(user('compliance'),id,{version,kind,action:'customer_delivery',status,authority:'Synthetic authority',evidence:'Synthetic evidence',...(expiresAt?{expiresAt}:{})},randomUUID());version=r.version;};
  decide('customs','HOLD');decide('biosecurity','HOLD');decide('customs','RELEASED');let r=f.eligibility(user(),id,'customer_delivery');assert.ok(!r.reasons.includes('customs: HOLD'));assert.ok(r.reasons.includes('biosecurity: HOLD'));assert.equal(r.eligible,false);
  decide('customs','RELEASED','2020-01-01T00:00:00Z');r=f.eligibility(user(),id,'customer_delivery');assert.ok(r.reasons.includes('customs: RELEASED (expired)'));assert.throws(()=>f.db.prepare('DELETE FROM clearances').run(),/immutable/);
 }finally{f.close();}
});
test('synthetic demo access is explicit and limited to expected loopback host',async()=>{
 const http=require('node:http');const get=(url,headers)=>new Promise((resolve,reject)=>http.get(url,{headers},r=>{r.resume();r.on('end',()=>resolve(r.statusCode));}).on('error',reject));
 for(const demo of [false,true]){const {server,freight}=createServer({filename:':memory:',users:[{...user(),token:'t'.repeat(40)}],demo});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/api/demo';try{
  assert.equal(await get(url,{Host:'localhost:4300'}),demo?200:404);
  if(demo){assert.equal(await get(url,{Host:'evil.example'}),404);assert.equal(await get(url,{Host:'localhost:4300','Sec-Fetch-Site':'cross-site'}),404);}
 }finally{await new Promise(r=>server.close(r));freight.close();}}
});
