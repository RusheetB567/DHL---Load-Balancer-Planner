const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {timingSafeEqual}=require('node:crypto');
const {createFreight,Fault}=require('./freight.cjs');
function createServer({filename=path.join(__dirname,'../../.data/iforos.sqlite'),users=[],demo=false}={}){
 const freight=createFreight(filename),web=path.join(__dirname,'../web');
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  try{
   const url=new URL(req.url,'http://localhost'),p=url.pathname;
   if(!p.startsWith('/api/')){if(req.method!=='GET')throw new Fault(405,'METHOD','Use GET.');const assets={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/sample.json':'sample.json','/sample.csv':'sample.csv'};if(!assets[p])throw new Fault(404,'NOT_FOUND','Page not found.');res.setHeader('Content-Type',{'/':'text/html','/app.js':'text/javascript','/style.css':'text/css','/sample.json':'application/json','/sample.csv':'text/csv'}[p]);return res.end(fs.readFileSync(path.join(web,assets[p])));}
   // Explicit synthetic demo only: loopback, same-origin, ephemeral role credentials.
   if(p==='/api/demo'&&req.method==='GET'){
    if(!demo||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!['127.0.0.1:4300','localhost:4300'].includes(req.headers.host)||req.headers['sec-fetch-site']==='cross-site')throw new Fault(404,'NOT_FOUND','Demo unavailable.');
    return send(res,200,{users:users.map(u=>({id:u.id,role:u.role,depot:u.depot,token:u.token}))});
   }
   const token=(req.headers.authorization||'').replace(/^Bearer /,'');const user=users.find(u=>{const a=Buffer.from(u.token),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);});
   if(!user)throw new Fault(401,'UNAUTHENTICATED','Enter a configured local access token.');
   if(req.method==='POST'&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)throw new Fault(403,'ORIGIN','Cross-origin mutation rejected.');}
   let body={};if(req.method==='POST'){if(!(req.headers['content-type']||'').startsWith('application/json'))throw new Fault(415,'CONTENT_TYPE','Use application/json.');let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>2_000_000)throw new Fault(413,'TOO_LARGE','Maximum request size is 2 MB.');parts.push(chunk);}try{body=JSON.parse(Buffer.concat(parts).toString());}catch{throw new Fault(400,'INVALID_JSON','Malformed JSON.');}if(!body||typeof body!=='object'||Array.isArray(body))throw new Fault(400,'INVALID_JSON','JSON object required.');}
   const key=req.headers['idempotency-key'];
   if(p==='/api/v1/me'&&req.method==='GET')return send(res,200,{id:user.id,role:user.role,depot:user.depot});
   if(p==='/api/v1/dashboard'&&req.method==='GET')return send(res,200,freight.dashboard(user));
   if(p==='/api/v1/audit'&&req.method==='GET')return send(res,200,{items:freight.audit(user)});
   if(p==='/api/v1/imports'&&req.method==='POST')return send(res,200,freight.importFreight(user,body,key));
   if(p==='/api/v1/receiving/scans'&&req.method==='POST'){const r=freight.receive(user,body,key);return send(res,r.rejected?409:200,r);}
   const match=p.match(/^\/api\/v1\/shipments\/([a-zA-Z0-9-]+)(?:\/(reconcile|clearances|eligibility))?$/);
   if(match){const [,id,operation]=match;if(req.method==='GET'&&!operation)return send(res,200,freight.detail(user,id));if(req.method==='GET'&&operation==='eligibility')return send(res,200,freight.eligibility(user,id,url.searchParams.get('action')));if(req.method==='POST'&&operation==='reconcile')return send(res,200,freight.reconcile(user,id,body,key));if(req.method==='POST'&&operation==='clearances')return send(res,200,freight.clearance(user,id,body,key));}
   throw new Fault(404,'NOT_FOUND','Endpoint not found.');
  }catch(e){if(!(e instanceof Fault))console.error(e);send(res,e.status||500,{error:{code:e.code||'INTERNAL',message:e.status?e.message:'Unexpected server error.'}});}
 });return {server,freight};
}
if(require.main===module){
 let users;try{users=JSON.parse(process.env.IFOROS_USERS||'[]');}catch{throw Error('IFOROS_USERS must be valid JSON.');}
 if(!Array.isArray(users)||!users.length||users.some(u=>!u.id||!u.depot||!['planner','warehouse','supervisor','compliance','auditor'].includes(u.role)||typeof u.token!=='string'||u.token.length<32)||new Set(users.map(u=>u.token)).size!==users.length)throw Error('Configure unique IFOROS_USERS tokens of at least 32 characters; see README.');
 const {server}=createServer({users});server.listen(Number(process.env.PORT||4300),'127.0.0.1',()=>console.log('IFOROS local foundation: http://127.0.0.1:'+ (process.env.PORT||4300)));
}
module.exports={createServer};
