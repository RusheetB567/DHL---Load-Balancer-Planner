(function(root){
 let generation=0,stream=null,reader=null;
 function stop(){generation++;if(reader){reader.reset();reader=null;}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}const video=document.querySelector('#barcode-video'),start=document.querySelector('#camera-start'),end=document.querySelector('#camera-stop');if(video){video.srcObject=null;video.hidden=true;}if(start)start.disabled=false;if(end)end.disabled=true;}
 function mount({onBarcode}){
  const start=document.querySelector('#camera-start'),end=document.querySelector('#camera-stop'),video=document.querySelector('#barcode-video'),status=document.querySelector('#camera-status');
  const report=s=>status.textContent=s;
  function close(){stop();video.srcObject=null;video.hidden=true;start.disabled=false;end.disabled=true;}
  end.onclick=()=>{close();report('Camera stopped.');};
  start.onclick=async()=>{
   close();const current=++generation;start.disabled=true;end.disabled=false;
   try{
    if(!root.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('Camera access needs HTTPS on your phone, or localhost on this computer. You can still use a scanner or type the barcode below.');
    if(!root.ZXing)throw Error('Barcode decoder is unavailable. Run npm install and restart the server.');
    report('Allow camera access in the browser prompt.');
    const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    if(current!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;reader=new root.ZXing.BrowserMultiFormatReader();const localReader=reader;video.hidden=false;
    report('Point the rear camera at one barcode. Keep the label steady and well lit.');
    await localReader.decodeFromStream(acquired,video,result=>{
     if(current!==generation||!result)return;
     const value=result.getText();close();report('Barcode captured. Check the value and location, then confirm receiving.');onBarcode(value);
    });
    if(current!==generation){localReader.reset();acquired.getTracks().forEach(t=>t.stop());}
   }catch(error){if(current!==generation)return;close();report(error.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser settings or use the scanner input.':error.name==='NotFoundError'?'No camera was found. Connect a camera or use the scanner input.':error.name==='NotReadableError'?'Camera is busy. Close other apps using it and try again.':error.message);}
  };
 }
 root.IFOROSScanner={mount,stop};
 if(root.addEventListener){root.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});}
})(window);
