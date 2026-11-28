const test=require('node:test'),assert=require('node:assert/strict');
const {createServer}=require('../apps/api/server.cjs');
test('preview health identifies a responding IFOROS database without granting operational access',async()=>{
 const {server,freight}=createServer({filename:':memory:'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{const response=await fetch(base+'/api/health');assert.equal(response.status,200);assert.deepEqual(await response.json(),{service:'iforos',ready:true});assert.equal((await fetch(base+'/api/v1/planning')).status,401);assert.equal((await fetch(base+'/api/v1/dashboard')).status,401);}
 finally{await new Promise(resolve=>server.close(resolve));freight.close();}
});
