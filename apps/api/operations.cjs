const {Fault}=require('./freight.cjs');
function adelaideTime(date,time){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new Fault(400,'INVALID_CYCLE','Choose a valid operating date and time.');
 const target=Date.parse(date+'T'+time+':00Z');if(!Number.isFinite(target))throw new Fault(400,'INVALID_CYCLE','Invalid operating date.');let value=target;
 const format=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Adelaide',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){const p=Object.fromEntries(format.formatToParts(new Date(value)).map(p=>[p.type,p.value]));const local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);value+=target-local;}
 return new Date(value).toISOString();
}
function cycleWindow(b){
 if(![1,2,3].includes(Number(b.finger))||!['A','B'].includes(b.cycle))throw new Fault(400,'INVALID_CYCLE','Choose Finger 1, 2 or 3 and Cycle A or B.');
 const start=b.cycleStart||(b.cycle==='A'?'07:00':'11:45'),end=b.cycleEnd||(b.cycle==='A'?'11:45':'17:00');
 if((b.cycle==='A'&&(start!=='07:00'||end<'11:30'||end>'11:45'))||(b.cycle==='B'&&(start<'11:30'||start>'11:45'||end<'16:00'||end>'17:00'))||start>=end)throw new Fault(400,'INVALID_CYCLE','Cycle times are outside the approved planning window.');
 return {finger:Number(b.finger),cycle:b.cycle,date:b.operatingDate,startAt:adelaideTime(b.operatingDate,start),endAt:adelaideTime(b.operatingDate,end)};
}
module.exports={adelaideTime,cycleWindow};
