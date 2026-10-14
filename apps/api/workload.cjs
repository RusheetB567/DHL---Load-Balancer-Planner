const {Fault}=require('./freight.cjs');
const assumptions=Object.freeze({version:'workload-baseline-1',stopServiceMinutes:5,pieceHandlingMinutes:.5,heavyPieceExtraMinutes:2,heavyThresholdKg:20,depotMinutes:10,contingencyFraction:.1});
function input(value,name,max=240){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max)throw new Fault(400,'INVALID_WORKLOAD',`Invalid ${name} estimate; supervisor review required.`);return value;}
const round=n=>Math.round(n*100)/100;
function shipmentWork(shipment){
 const meta=shipment.data||{};const serviceMinutes=input(meta.serviceMinutes??assumptions.stopServiceMinutes,'service minutes');const accessMinutes=input(meta.accessMinutes??0,'access minutes');
 const handlingMinutes=shipment.pieces.reduce((sum,p)=>sum+assumptions.pieceHandlingMinutes+(p.weight_kg>=assumptions.heavyThresholdKg?assumptions.heavyPieceExtraMinutes:0),0);
 return {serviceMinutes,accessMinutes,handlingMinutes:round(handlingMinutes),stopMinutes:round(serviceMinutes+accessMinutes+handlingMinutes),assumptionVersion:assumptions.version,explanation:`${serviceMinutes} service + ${accessMinutes} access + ${round(handlingMinutes)} handling minutes. Travel requires a road plan.`,provisional:true};
}
function runWork(run){
 const stopMinutes=run.stops.reduce((t,s)=>t+s.service_minutes,0),travelMinutes=Number.isFinite(run.route?.travelSeconds)?run.route.travelSeconds/60:null;
 const base=stopMinutes+assumptions.depotMinutes+(travelMinutes??0),contingencyMinutes=base*assumptions.contingencyFraction,knownMinutes=base+contingencyMinutes;
 const availableMinutes=(Date.parse(run.end_at)-Date.parse(run.start_at))/60000;
 return {stopMinutes:round(stopMinutes),depotMinutes:assumptions.depotMinutes,travelMinutes:travelMinutes===null?null:round(travelMinutes),contingencyMinutes:round(contingencyMinutes),knownMinutes:round(knownMinutes),availableMinutes:round(availableMinutes),utilisationLowerBound:availableMinutes>0?round(knownMinutes/availableMinutes):null,overloaded:knownMinutes>availableMinutes,complete:false,missingComponents:[...(travelMinutes===null?['road travel']:[]),'approved break/handling/access policy','pickup work (not modelled)'],assumptionVersion:assumptions.version,explanation:'Provisional working-time lower bound. Unknown components are not represented as zero-cost work.'};
}
module.exports={shipmentWork,runWork,assumptions};
