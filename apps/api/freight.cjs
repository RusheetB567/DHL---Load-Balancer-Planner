const {DatabaseSync}=require('node:sqlite');
const {randomUUID,createHash}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
class Fault extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code;}}
function check(ok,status,code,message){if(!ok)throw new Fault(status,code,message);}
function text(v,name,optional=false){check(typeof v==='string'&&v.length<=2000&&(optional||v.trim()),400,'INVALID_INPUT',`${name} must be text.`);return v.trim();}
function number(v,name,zero=false){check(typeof v==='number'&&Number.isFinite(v)&&v>=(zero?0:0.1)&&v<=100000,400,'INVALID_INPUT',`${name} must be a valid measurement.`);return v;}
function time(v,name){check(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v)),400,'INVALID_TIME',`${name} requires an ISO timestamp with timezone.`);return new Date(v).toISOString();}
const kinds=['customs','biosecurity','aviation_security','dangerous_goods','sanctions','internal'];
const actions=['airport_transfer','warehouse_move','loading','customer_delivery','outbound_tender'];
const now=()=>new Date().toISOString();
// CSV supports quoted commas, escaped quotes and embedded newlines. No formula evaluation.
function parseCSV(content){
 check(typeof content==='string'&&content.length<=2_000_000,400,'INVALID_FILE','CSV exceeds the import limit.');
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<content.length;i++){const c=content[i];if(c==='"'){if(quoted&&content[i+1]==='"'){cell+='"';i++;}else {check(quoted||cell==='',400,'INVALID_CSV','Unexpected quote.');quoted=!quoted;}}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&content[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell='';}else cell+=c;}
 check(!quoted,400,'INVALID_CSV','Unclosed quoted field.');row.push(cell);if(row.some(x=>x!==''))rows.push(row);
 const headers=rows.shift()||[];check(headers.length>0&&new Set(headers).size===headers.length,400,'INVALID_CSV','CSV headers must be unique.');
 return rows.map(r=>{check(r.length===headers.length,400,'INVALID_CSV','Row width differs from header.');return Object.fromEntries(headers.map((h,i)=>[h.replace(/^\uFEFF/,''),r[i]]));});
}
function normalize(body){
 check(body&&typeof body==='object',400,'INVALID_INPUT','Import body required.');
 if(body.format==='cisdriver3'){
  check(Array.isArray(body.items),400,'INVALID_INPUT','CisDriver cargo items required.');
  return body.items.map(f=>{const d=f.data||{};check(Array.isArray(f.packages),400,'INVALID_INPUT','Packages required.');
   return {reference:d.consignmentNumber||d.awb||d.mawb||d.hawb,sourceId:f.id,awb:d.awb||'',mawb:d.mawb||'',hawb:d.hawb||'',client:d.client||'',destination:d.destinationAddress||'',dueAt:f.dueAt,sourceMetadata:d,
    pieces:f.packages.map(p=>{check(p.count===1,400,'PIECE_IDENTITY_REQUIRED','CisDriver grouped packages need individual barcodes before import.');return {barcode:p.barcode,weightKg:p.weight_kg??p.weightKg,lengthCm:p.length_cm??p.lengthCm,widthCm:p.width_cm??p.widthCm,heightCm:p.height_cm??p.heightCm};})};});
 }
 if(body.format==='csv'){
  const grouped=new Map();for(const r of parseCSV(body.content)){
   const meta={reference:r.reference,dueAt:r.dueAt,awb:r.awb||'',mawb:r.mawb||'',hawb:r.hawb||'',client:r.client||'',destination:r.destination||''};
   if(grouped.has(r.reference))check(JSON.stringify(grouped.get(r.reference).meta)===JSON.stringify(meta),400,'SHIPMENT_CONFLICT','Rows disagree on shipment fields.');else grouped.set(r.reference,{meta,pieces:[]});
   for(const field of ['weightKg','lengthCm','widthCm','heightCm'])check(typeof r[field]==='string'&&r[field].trim()!=='',400,'INVALID_INPUT',`${field} is required.`);
   grouped.get(r.reference).pieces.push({barcode:r.barcode,weightKg:Number(r.weightKg),lengthCm:Number(r.lengthCm),widthCm:Number(r.widthCm),heightCm:Number(r.heightCm)});
  }return [...grouped.values()].map(g=>({...g.meta,pieces:g.pieces}));
 }
 check(body.format==='json'&&Array.isArray(body.shipments),400,'INVALID_FORMAT','Use json, csv or cisdriver3.');return body.shipments;
}
function createFreight(filename=':memory:'){
 if(filename!==':memory:')fs.mkdirSync(path.dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');db.exec(fs.readFileSync(path.join(__dirname,'migrations/001_foundation.sql'),'utf8'));
 function event(u,action,entity,detail){db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run(randomUUID(),u.depot,u.id,action,entity,JSON.stringify(detail),now());}
 function allowed(u,roles){if(!roles.includes(u.role)){event(u,'access.denied','role',{operation:roles});throw new Fault(403,'FORBIDDEN','Role does not permit this operation.');}}
 function scoped(u,id){const s=db.prepare('SELECT * FROM shipments WHERE depot=? AND id=?').get(u.depot,id);check(s,404,'NOT_FOUND','Shipment not found.');return s;}
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}
 function mutate(u,key,body,fn){text(key,'Idempotency-Key');const digest=createHash('sha256').update(JSON.stringify(body)).digest('hex');return transaction(()=>{const prior=db.prepare('SELECT * FROM requests WHERE depot=? AND actor=? AND key=?').get(u.depot,u.id,key);if(prior){check(prior.digest===digest,409,'IDEMPOTENCY_CONFLICT','Key already used for a different request.');return JSON.parse(prior.response);}const result=fn();db.prepare('INSERT INTO requests VALUES(?,?,?,?,?)').run(u.depot,u.id,key,digest,JSON.stringify(result));return result;});}
 function exception(u,id,kind,detail){db.prepare('INSERT INTO exceptions VALUES(?,?,?,?,?,?,?)').run(randomUUID(),u.depot,id,kind,detail,'OPEN',now());}
 function eligibility(u,id,action){check(actions.includes(action),400,'INVALID_ACTION','Unknown movement action.');const s=scoped(u,id),pieces=db.prepare('SELECT * FROM pieces WHERE depot=? AND shipment_id=?').all(u.depot,id);
  const records=db.prepare('SELECT * FROM clearances WHERE depot=? AND shipment_id=? AND action=? ORDER BY rowid DESC').all(u.depot,id,action);
  const latest=new Map();for(const r of records)if(!latest.has(r.kind))latest.set(r.kind,r);
  const reasons=['Approved business-unit compliance profile is not configured.'];
  for(const r of latest.values())if(r.status!=='RELEASED'||(r.expires_at&&r.expires_at<=now()))reasons.push(`${r.kind}: ${r.status}${r.expires_at&&r.expires_at<=now()?' (expired)':''}`);
  if(pieces.some(p=>!p.received_at))reasons.push('Shipment has unreceived pieces.');
  return {action,eligible:false,reasons,version:s.version};
 }
 function detail(u,id){const s=scoped(u,id),pieces=db.prepare('SELECT * FROM pieces WHERE depot=? AND shipment_id=? ORDER BY barcode').all(u.depot,id);return {...s,data:JSON.parse(s.data),pieces,totals:{pieces:pieces.length,received:pieces.filter(p=>p.received_at).length,weightKg:pieces.reduce((t,p)=>t+p.weight_kg,0),volumeM3:pieces.reduce((t,p)=>t+p.length_cm*p.width_cm*p.height_cm/1e6,0)},clearances:db.prepare('SELECT * FROM clearances WHERE depot=? AND shipment_id=? ORDER BY rowid DESC').all(u.depot,id),eligibility:eligibility(u,id,'customer_delivery')};}
 function importFreight(u,body,key){allowed(u,['planner','supervisor']);const source=body.format==='cisdriver3'?'cisdriver3':'manifest';const rows=normalize(body);check(rows.length>0&&rows.length<=1500,400,'IMPORT_LIMIT','Import 1–1500 shipments.');
  const normalized=rows.map(s=>{check(s&&typeof s==='object',400,'INVALID_INPUT','Invalid shipment.');check(Array.isArray(s.pieces)&&s.pieces.length>0&&s.pieces.length<=1500,400,'PIECES_REQUIRED','Shipment needs 1–1500 individual pieces.');return {...s,reference:text(s.reference,'Reference'),dueAt:time(s.dueAt,'Commitment'),pieces:s.pieces.map(p=>({barcode:text(p.barcode,'Barcode'),weightKg:number(p.weightKg,'Weight',true),lengthCm:number(p.lengthCm,'Length'),widthCm:number(p.widthCm,'Width'),heightCm:number(p.heightCm,'Height')}))};});
  check(normalized.reduce((t,s)=>t+s.pieces.length,0)<=1500,400,'IMPORT_LIMIT','Maximum 1500 pieces per import.');
  return mutate(u,key,{operation:'import',body},()=>{const result={created:[],duplicates:[]};for(const s of normalized){const existing=db.prepare('SELECT id,data FROM shipments WHERE depot=? AND source=? AND reference=?').get(u.depot,source,s.reference);
   if(existing){check(existing.data===JSON.stringify(s),409,'SOURCE_CONFLICT','Existing shipment differs. Review an update rather than overwriting freight.');result.duplicates.push(existing.id);event(u,'import.duplicate',existing.id,{reference:s.reference});continue;}
   const id=randomUUID();db.prepare('INSERT INTO shipments VALUES(?,?,?,?,?,?,1,?)').run(id,u.depot,source,s.reference,JSON.stringify(s),s.dueAt,now());
   for(const p of s.pieces){check(!db.prepare('SELECT id FROM pieces WHERE depot=? AND barcode=?').get(u.depot,p.barcode),409,'BARCODE_EXISTS',`Barcode ${p.barcode} already registered.`);db.prepare('INSERT INTO pieces VALUES(?,?,?,?,?,?,?,?,NULL,NULL)').run(randomUUID(),u.depot,id,p.barcode,p.weightKg,p.lengthCm,p.widthCm,p.heightCm);}
   event(u,'shipment.imported',id,{source,reference:s.reference,pieces:s.pieces.length});result.created.push(id);
  }return result;});
 }
 function receive(u,body,key){allowed(u,['warehouse','supervisor']);const barcode=text(body.barcode,'Barcode'),location=text(body.location,'Location');check(/^NETLEY\/(RECEIVING|STAGING|FINGER-[A-Z0-9]+)$/.test(location)&&u.depot==='NETLEY',400,'INVALID_LOCATION','Use a configured Netley receiving, staging or finger location.');
  const result=mutate(u,key,{operation:'receive',body},()=>{const p=db.prepare('SELECT * FROM pieces WHERE depot=? AND barcode=?').get(u.depot,barcode);
   if(!p){exception(u,null,'UNKNOWN_BARCODE',barcode);event(u,'receiving.unknown',barcode,{});return {rejected:'UNKNOWN_BARCODE',message:'Unknown barcode entered the exception register.'};}
   const s=scoped(u,p.shipment_id);
   if(p.received_at){exception(u,s.id,'DUPLICATE_SCAN',barcode);event(u,'receiving.duplicate',p.id,{});return {rejected:'DUPLICATE_SCAN',message:'Piece already received; physical state preserved.'};}
   check(body.version===s.version,409,'VERSION_CONFLICT','Refresh the shipment before receiving.');
   db.prepare('UPDATE pieces SET received_at=?,location=? WHERE id=?').run(now(),location,p.id);db.prepare('UPDATE shipments SET version=version+1 WHERE id=?').run(s.id);event(u,'piece.received',p.id,{shipment:s.id,location});
   if(!db.prepare('SELECT id FROM pieces WHERE shipment_id=? AND received_at IS NULL').get(s.id))db.prepare("UPDATE exceptions SET state='RESOLVED' WHERE shipment_id=? AND kind='MISSING_PIECES' AND state='OPEN'").run(s.id);
   return detail(u,s.id);});return result;
 }
 function reconcile(u,id,body,key){allowed(u,['warehouse','supervisor']);return mutate(u,key,{operation:'reconcile',id,body},()=>{const s=scoped(u,id);check(body.version===s.version,409,'VERSION_CONFLICT','Refresh shipment.');const missing=db.prepare('SELECT barcode FROM pieces WHERE shipment_id=? AND received_at IS NULL').all(id).map(p=>p.barcode);if(missing.length&&!db.prepare("SELECT id FROM exceptions WHERE shipment_id=? AND kind='MISSING_PIECES' AND state='OPEN'").get(id))exception(u,id,'MISSING_PIECES',JSON.stringify(missing));event(u,'receiving.reconciled',id,{missing});db.prepare('UPDATE shipments SET version=version+1 WHERE id=?').run(id);return {missing,version:s.version+1};});}
 function clearance(u,id,body,key){allowed(u,['compliance']);check(kinds.includes(body.kind)&&actions.includes(body.action)&&['HOLD','PENDING','RELEASED'].includes(body.status),400,'INVALID_CLEARANCE','Specify kind, action and status.');const authority=text(body.authority,'Authority'),evidence=text(body.evidence,'Evidence'),expires=body.expiresAt?time(body.expiresAt,'Expiry'):null;
  return mutate(u,key,{operation:'clearance',id,body},()=>{const s=scoped(u,id);check(body.version===s.version,409,'VERSION_CONFLICT','Refresh shipment.');db.prepare('INSERT INTO clearances VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),u.depot,id,body.kind,body.action,body.status,authority,evidence,expires,u.id,now());db.prepare('UPDATE shipments SET version=version+1 WHERE id=?').run(id);event(u,'clearance.recorded',id,{kind:body.kind,action:body.action,status:body.status,authority,evidence});return detail(u,id);});}
 function dashboard(u){const shipments=db.prepare('SELECT id FROM shipments WHERE depot=? ORDER BY created_at DESC').all(u.depot).map(s=>detail(u,s.id));const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Adelaide',year:'numeric',month:'2-digit',day:'2-digit'});const date=t=>today.format(new Date(t));return {depot:u.depot,shipments,metrics:{shipments:shipments.length,expectedPieces:shipments.reduce((t,s)=>t+s.totals.pieces,0),receivedPieces:shipments.reduce((t,s)=>t+s.totals.received,0),missingPieces:shipments.reduce((t,s)=>t+s.totals.pieces-s.totals.received,0),dueToday:shipments.filter(s=>date(s.due_at)===date(now())).length,overdue:shipments.filter(s=>s.due_at<now()).length,held:shipments.filter(s=>s.eligibility.reasons.some(r=>/HOLD/.test(r))).length,eligible:0},exceptions:db.prepare('SELECT * FROM exceptions WHERE depot=? ORDER BY created_at DESC').all(u.depot)};}
 return {db,detail,importFreight,receive,reconcile,clearance,eligibility,dashboard,audit:u=>db.prepare('SELECT * FROM events WHERE depot=? ORDER BY rowid DESC LIMIT 500').all(u.depot),close:()=>db.close()};
}
module.exports={createFreight,Fault,parseCSV};
