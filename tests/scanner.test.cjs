const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(getUserMedia){
 const elements=Object.fromEntries(['camera-start','camera-stop','barcode-video','camera-status'].map(id=>['#'+id,{disabled:false,hidden:false,textContent:'',srcObject:null}]));let decoded,reset=0,stopped=0,barcode;
 const stream={getTracks:()=>[{stop:()=>stopped++}]};
 const window={isSecureContext:true,addEventListener(){},ZXing:{BrowserMultiFormatReader:class{async decodeFromStream(s,v,cb){assert.equal(s,stream);decoded=cb;}reset(){reset++;}}}};
 const context={window,document:{querySelector:s=>elements[s],addEventListener(){}},navigator:{mediaDevices:{getUserMedia: getUserMedia||async function(constraints){assert.equal(constraints.audio,false);return stream;}}}};
 vm.runInNewContext(fs.readFileSync('apps/web/scanner.js','utf8'),context);window.IFOROSScanner.mount({onBarcode:value=>barcode=value});
 return {window,elements,stream,decode:value=>decoded({getText:()=>value}),state:()=>({reset,stopped,barcode})};
}
test('camera permission occurs on tap; decode stops camera and produces one barcode',async()=>{
 const f=fixture();assert.equal(f.state().stopped,0);await f.elements['#camera-start'].onclick();assert.equal(f.elements['#barcode-video'].hidden,false);f.decode('SYN-P001');f.decode('SYN-P002');assert.equal(f.state().barcode,'SYN-P001');assert.ok(f.state().stopped>0);assert.equal(f.elements['#barcode-video'].hidden,true);
});
test('denied camera permission has recovery guidance',async()=>{
 const f=fixture(async()=>{const e=Error();e.name='NotAllowedError';throw e;});await f.elements['#camera-start'].onclick();assert.match(f.elements['#camera-status'].textContent,/denied/);assert.equal(f.elements['#camera-start'].disabled,false);
});
test('cancel during permission request releases late camera stream',async()=>{
 let resolve;const f=fixture(()=>new Promise(r=>resolve=r));const pending=f.elements['#camera-start'].onclick();f.elements['#camera-stop'].onclick();resolve(f.stream);await pending;assert.equal(f.state().stopped,1);assert.equal(f.state().barcode,undefined);
});
