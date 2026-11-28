const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {timingSafeEqual}=require('node:crypto');
const {createFreight,Fault}=require('./freight.cjs');
const {createPlanning}=require('./planning.cjs');
const {createTerritories}=require('./territories.cjs');
const {roadProvider,demoRoadProvider}=require('./routing.cjs');
function createServer({filename=path.join(__dirname,'../../.data/iforos.sqlite'),users=[],demo=false}={}){
 const freight=createFreight(filename),web=path.join(__dirname,'../web');
 const planning=createPlanning(freight,{users,demo,provider:roadProvider(process.env.IFOROS_ROUTING_URL)||(demo?demoRoadProvider():null)});
 const territories=createTerritories(freight,{users});
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; img-src 'self' blob: data:; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  try{
   const url=new URL(req.url,'http://localhost'),p=url.pathname;
   if(p==='/api/health'&&req.method==='GET'){freight.db.prepare('SELECT 1').get();return send(res,200,{service:'iforos',ready:true});}
   if(req.method==='GET'&&p.startsWith('/ocr/')){
    const fixed={'/ocr/tesseract.min.js':'tesseract.js/dist/tesseract.min.js','/ocr/worker.min.js':'tesseract.js/dist/worker.min.js','/ocr/lang/eng.traineddata.gz':'@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'};
    let file=fixed[p];const core=p.match(/^\/ocr\/core\/(tesseract-core(?:-(?:relaxedsimd|simd))?(?:-lstm)?(?:\.wasm)?\.js|tesseract-core(?:-(?:relaxedsimd|simd))?(?:-lstm)?\.wasm)$/);
    if(core)file='tesseract.js-core/'+core[1];if(!file)throw new Fault(404,'NOT_FOUND','OCR asset not found.');
    res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.wasm')?'application/wasm':'application/octet-stream');return res.end(fs.readFileSync(path.join(__dirname,'../../node_modules',file)));
   }
   if(!p.startsWith('/api/')){if(req.method!=='GET')throw new Fault(405,'METHOD','Use GET.');const assets={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/sample.json':'sample.json','/sample.csv':'sample.csv','/premium.js':'premium.js','/premium.css':'premium.css','/forecast.js':'forecast.js','/address-capture.js':'address-capture.js','/redesign.css':'redesign.css','/route-map.js':'route-map.js','/experience.js':'experience.js','/planning.js':'planning.js','/scanner.js':'scanner.js','/barcode-decoder.js':'../../node_modules/@zxing/library/umd/index.min.js'};if(!assets[p])throw new Fault(404,'NOT_FOUND','Page not found.');res.setHeader('Content-Type',{'/':'text/html','/app.js':'text/javascript','/style.css':'text/css','/sample.json':'application/json','/sample.csv':'text/csv','/premium.js':'text/javascript','/premium.css':'text/css','/forecast.js':'text/javascript','/address-capture.js':'text/javascript','/redesign.css':'text/css','/route-map.js':'text/javascript','/experience.js':'text/javascript','/planning.js':'text/javascript','/scanner.js':'text/javascript','/barcode-decoder.js':'text/javascript'}[p]);return res.end(fs.readFileSync(path.join(web,assets[p])));}
   // Explicit synthetic demo only: loopback, same-origin, ephemeral role credentials.
   if(p==='/api/demo'&&req.method==='GET'){
    if(!demo||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!['127.0.0.1:4300','localhost:4300'].includes(req.headers.host)||req.headers['sec-fetch-site']==='cross-site')throw new Fault(404,'NOT_FOUND','Demo unavailable.');
    return send(res,200,{users:users.map(u=>({id:u.id,name:u.name||u.role,role:u.role,depot:u.depot,token:u.token}))});
   }
   const token=(req.headers.authorization||'').replace(/^Bearer /,'');const user=users.find(u=>{const a=Buffer.from(u.token),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);});
   if(!user)throw new Fault(401,'UNAUTHENTICATED','Enter a configured local access token.');
   if(user.role==='driver'&&!['/api/v1/me','/api/v1/planning','/api/v1/address-drafts'].includes(p)&&!/^\/api\/v1\/runs\//.test(p)&&!/^\/api\/v1\/address-drafts\//.test(p))throw new Fault(403,'FORBIDDEN','Drivers can access only their assigned runs.');
   if(req.method==='POST'&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)throw new Fault(403,'ORIGIN','Cross-origin mutation rejected.');}
   let body={};if(req.method==='POST'){if(!(req.headers['content-type']||'').startsWith('application/json'))throw new Fault(415,'CONTENT_TYPE','Use application/json.');let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>2_000_000)throw new Fault(413,'TOO_LARGE','Maximum request size is 2 MB.');parts.push(chunk);}try{body=JSON.parse(Buffer.concat(parts).toString());}catch{throw new Fault(400,'INVALID_JSON','Malformed JSON.');}if(!body||typeof body!=='object'||Array.isArray(body))throw new Fault(400,'INVALID_JSON','JSON object required.');}
   const key=req.headers['idempotency-key'];
   if(p==='/api/v1/territories'&&req.method==='GET')return send(res,200,territories.profiles(user));
   const territoryMatch=p.match(/^\/api\/v1\/territories\/([A-Z0-9]+)$/);
   if(territoryMatch&&req.method==='POST')return send(res,200,territories.configure(user,territoryMatch[1],body,key));
   if(p==='/api/v1/forecast'&&req.method==='GET')return send(res,200,territories.forecast(user,url.searchParams.get('date'),url.searchParams.get('cycle')));
   const addressMatch=p.match(/^\/api\/v1\/address-drafts\/([a-zA-Z0-9-]+)\/archive$/);
   if(addressMatch&&req.method==='POST')return send(res,200,territories.archiveAddress(user,addressMatch[1],body,key));
   if(p==='/api/v1/address-drafts'&&req.method==='GET')return send(res,200,territories.addresses(user));
   if(p==='/api/v1/address-drafts'&&req.method==='POST')return send(res,200,territories.confirmAddress(user,body,key));
   if(p==='/api/v1/flexi-requests'&&req.method==='GET')return send(res,200,territories.requests(user,url.searchParams.get('date')));
   if(p==='/api/v1/flexi-requests'&&req.method==='POST')return send(res,200,territories.requestHelp(user,body,key));
   const flexiMatch=p.match(/^\/api\/v1\/flexi-requests\/([a-zA-Z0-9-]+)$/);
   if(flexiMatch&&req.method==='POST')return send(res,200,territories.resolveHelp(user,flexiMatch[1],body,key));
   if(p==='/api/v1/planning'&&req.method==='GET')return send(res,200,planning.board(user));
   if(p==='/api/v1/runs'&&req.method==='POST')return send(res,200,planning.create(user,body,key));
   if(p==='/api/v1/planning/allocate'&&req.method==='POST')return send(res,200,planning.auto(user,body,key));
   const runMatch=p.match(/^\/api\/v1\/runs\/([a-zA-Z0-9-]+)(?:\/(stops|send|scans|changes|resolve|reorder|optimize|configure))?$/);
   if(runMatch){const [,id,op]=runMatch;if(req.method==='GET'&&!op)return send(res,200,planning.detail(user,id));const methods={stops:'add',send:'send',scans:'scan',changes:'requestChange',resolve:'resolve',reorder:'reorder',optimize:'optimize',configure:'configure'};if(req.method==='POST'&&methods[op])return send(res,200,await planning[methods[op]](user,id,body,key));}
   if(p==='/api/v1/me'&&req.method==='GET')return send(res,200,{id:user.id,role:user.role,depot:user.depot});
   if(p==='/api/v1/dashboard'&&req.method==='GET')return send(res,200,freight.dashboard(user));
   if(p==='/api/v1/audit'&&req.method==='GET')return send(res,200,{items:freight.audit(user)});
   if(p==='/api/v1/imports'&&req.method==='POST')return send(res,200,freight.importFreight(user,body,key));
   if(p==='/api/v1/receiving/scans'&&req.method==='POST'){const r=freight.receive(user,body,key);return send(res,r.rejected?409:200,r);}
   const match=p.match(/^\/api\/v1\/shipments\/([a-zA-Z0-9-]+)(?:\/(reconcile|clearances|eligibility))?$/);
   if(match){const [,id,operation]=match;if(req.method==='GET'&&!operation)return send(res,200,freight.detail(user,id));if(req.method==='GET'&&operation==='eligibility')return send(res,200,freight.eligibility(user,id,url.searchParams.get('action')));if(req.method==='POST'&&operation==='reconcile')return send(res,200,freight.reconcile(user,id,body,key));if(req.method==='POST'&&operation==='clearances')return send(res,200,freight.clearance(user,id,body,key));}
   throw new Fault(404,'NOT_FOUND','Endpoint not found.');
  }catch(e){if(!(e instanceof Fault))console.error(e);send(res,e.status||500,{error:{code:e.code||'INTERNAL',message:e.status?e.message:'Unexpected server error.'}});}
 });return {server,freight,planning,territories};
}
if(require.main===module){
 let users;try{users=JSON.parse(process.env.IFOROS_USERS||'[]');}catch{throw Error('IFOROS_USERS must be valid JSON.');}
 if(!Array.isArray(users)||!users.length||users.some(u=>!u.id||!u.depot||!['planner','warehouse','supervisor','compliance','auditor','driver'].includes(u.role)||typeof u.token!=='string'||u.token.length<32)||new Set(users.map(u=>u.token)).size!==users.length)throw Error('Configure unique IFOROS_USERS tokens of at least 32 characters; see README.');
 const {server}=createServer({users});server.listen(Number(process.env.PORT||4300),'127.0.0.1',()=>console.log('IFOROS local foundation: http://127.0.0.1:'+ (process.env.PORT||4300)));
}
module.exports={createServer};
