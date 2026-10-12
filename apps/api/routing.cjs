// Routes are computed from a configured road provider, never straight-line distance.
const {Fault}=require('./freight.cjs');
function validateMatrix(matrix,n){if(!Array.isArray(matrix)||matrix.length!==n||matrix.some(row=>!Array.isArray(row)||row.length!==n||row.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)))throw new Fault(502,'ROAD_DATA_INVALID','Routing service returned missing or invalid road times.');}
function schedule(order,stops,matrix,start,end){let clock=start,previous=0,travel=0;const visits=[];
 for(const index of order){const s=stops[index],seconds=matrix[previous][index+1];clock+=seconds*1000;travel+=seconds;
  if(clock+s.service_minutes*60000>Date.parse(s.due_at))return null;visits.push({id:s.id,arrival:new Date(clock).toISOString(),departure:new Date(clock+s.service_minutes*60000).toISOString()});clock+=s.service_minutes*60000;previous=index+1;}
 travel+=matrix[previous][0];clock+=matrix[previous][0]*1000;if(clock>end)return null;
 return {order:order.map(i=>stops[i].id),visits,travelSeconds:travel,returnAt:new Date(clock).toISOString()};
}
function solve(stops,matrix,start,end){validateMatrix(matrix,stops.length+1);if(!stops.length)return {status:'EMPTY',order:[]};
 const n=stops.length;let best=null;
 if(n<=8){function visit(order,left){if(!left.length){const p=schedule(order,stops,matrix,start,end);if(p&&(!best||p.travelSeconds<best.travelSeconds))best=p;return;}for(const i of left)visit([...order,i],left.filter(j=>j!==i));}visit([],stops.map((_,i)=>i));return best?{...best,status:'FEASIBLE',method:'Exact minimum driving time across all stop orders',optimalForMatrix:true}:{status:'INFEASIBLE',order:[],unassigned:stops.map(s=>s.id),reason:'No stop order meets delivery deadlines and depot return time.'};}
 const left=stops.map((_,i)=>i),order=[];let previous=0;while(left.length){left.sort((a,b)=>matrix[previous][a+1]-matrix[previous][b+1]);const next=left.shift();order.push(next);previous=next+1;}best=schedule(order,stops,matrix,start,end);
 return best?{...best,status:'FEASIBLE',method:'Nearest-road-time heuristic; best possible order is not proven',optimalForMatrix:false}:{status:'NO_FEASIBLE_PLAN_FOUND',order:[],unassigned:stops.map(s=>s.id),reason:'Heuristic found no feasible plan. Supervisor review required; infeasibility is not proven.'};
}
function roadProvider(base){
 if(!base)return null;const url=new URL(base);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('Configure a valid routing service base URL.');
 if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('Remote routing providers require HTTPS.');
 const request=async p=>{const r=await fetch(base.replace(/\/$/,'')+p,{signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw new Fault(502,'ROAD_SERVICE_FAILED','Road routing service failed.');const json=await r.json();if(json.code!=='Ok')throw new Fault(502,'ROAD_SERVICE_FAILED','Road routing service could not calculate this route.');return json;};
 const coordinates=points=>points.map(p=>`${p.lon},${p.lat}`).join(';');
 return {matrix:async points=>(await request('/table/v1/driving/'+coordinates(points)+'?annotations=duration')).durations,
  geometry:async points=>{const json=await request('/route/v1/driving/'+coordinates(points)+'?overview=full&geometries=geojson');return json.routes[0];}};
}
function demoRoadProvider(){
 const fs=require('node:fs'),path=require('node:path');const file=path.join(__dirname,'demo-road-snapshot.json');if(!fs.existsSync(file))return null;const snapshot=JSON.parse(fs.readFileSync(file,'utf8'));
 const indices=points=>points.map(p=>{const index=snapshot.points.findIndex(s=>Math.abs(s.lat-p.lat)<1e-8&&Math.abs(s.lon-p.lon)<1e-8);if(index<0)throw new Fault(503,'ROAD_DATA_NEEDED','This stop is outside the fixed synthetic road demonstration. Connect an approved live road provider.');return index;});
 return {syntheticOnly:true,source:snapshot.source,recordedAt:snapshot.recordedAt,
  matrix:async points=>{const ids=indices(points);return ids.map(i=>ids.map(j=>snapshot.durations[i][j]));},
  geometry:async points=>{const ids=indices(points);const coordinates=[];let distance=0;for(let i=1;i<ids.length;i++){if(ids[i]===ids[i-1])continue;const leg=snapshot.legs[ids[i-1]+','+ids[i]];coordinates.push(...leg.geometry.coordinates);distance+=leg.distance;}return {distance,geometry:{type:'LineString',coordinates}};}};
}
module.exports={solve,schedule,roadProvider,demoRoadProvider};
