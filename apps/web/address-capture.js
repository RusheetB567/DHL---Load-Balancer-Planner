(function(root){
 function parseAddressText(text){
  const lines=String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean),matches=[];
  lines.forEach((line,index)=>{const match=line.match(/^(.*?)\s*,?\s+(?:SA|SOUTH AUSTRALIA)\s+(\d{4})(?:\s+AUSTRALIA)?\s*$/i);if(match)matches.push({index,suburb:match[1].replace(/,$/,'').trim(),postcode:match[2]});});
  if(matches.length!==1)return {address:'',suburb:'',postcode:'',needsReview:true,message:matches.length>1?'Multiple addresses found. Select and confirm one stop at a time.':'Address fields could not be separated safely. Please enter and confirm them.'};
  const match=matches[0];let suburb=match.suburb,address='';
  if(suburb.includes(',')){const parts=suburb.split(',').map(s=>s.trim());suburb=parts.pop();address=parts.join(', ');}
  if(!address)address=lines.slice(0,match.index).reverse().find(line=>/^\s*(?:UNIT\s+|SHOP\s+|SUITE\s+)?\d/i.test(line))||'';
  return {address,suburb,postcode:match.postcode,needsReview:true,message:'Suggested address only. Read the label and confirm every field.'};
 }
 let generation=0,worker=null,activeCamera=null,cameraDialog=null;
 function stop(){generation++;if(worker){worker.terminate().catch(()=>{});worker=null;}if(activeCamera){activeCamera.getTracks().forEach(track=>track.stop());activeCamera=null;}if(cameraDialog){cameraDialog.close();cameraDialog.remove();cameraDialog=null;}}
 function mount(){
  const form=document.querySelector('#address-form'),camera=document.querySelector('#camera-photo'),photo=document.querySelector('#upload-photo'),progress=document.querySelector('#address-progress'),cancel=document.querySelector('#address-cancel');let source='MANUAL',requestKey=null,pendingDigest=null;
  const report=text=>progress.textContent=text;
  const suggest=()=>{const result=parseAddressText(form.sourceText.value);form.address.value=result.address;form.suburb.value=result.suburb;form.postcode.value=result.postcode;form.confirmed.checked=false;report(result.message);};
  document.querySelector('#suggest-address').onclick=suggest;
  document.querySelector('#address-camera').onclick=async()=>{
   if(!root.isSecureContext||!navigator.mediaDevices?.getUserMedia){report('Live camera needs HTTPS on your phone. You can choose a photo or type the address.');camera.click();return;}
   stop();const session=++generation;report('Allow camera access when your browser asks.');
   try{const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});if(session!==generation){acquired.getTracks().forEach(track=>track.stop());return;}activeCamera=acquired;
    const dialog=document.createElement('dialog');cameraDialog=dialog;dialog.className='address-camera-sheet';dialog.innerHTML='<div class="camera-sheet-top"><button type="button" id="close-address-camera" aria-label="Close camera">×</button><strong>Read a printed address</strong><span>Local processing</span></div><div class="camera-viewfinder"><video autoplay muted playsinline></video><div class="address-target"><span>Place one complete address inside the frame</span></div></div><div class="camera-sheet-bottom"><p>Keep the label steady and well lit. You will check the text before saving.</p><button type="button" id="capture-address" disabled>Capture & read address</button></div>';document.body.append(dialog);dialog.showModal();const video=dialog.querySelector('video');video.srcObject=acquired;await video.play();if(session!==generation)return;const capture=dialog.querySelector('#capture-address');capture.disabled=false;dialog.querySelector('#close-address-camera').onclick=()=>{stop();report('Camera closed.');};dialog.oncancel=e=>{e.preventDefault();stop();report('Camera closed.');};
    capture.onclick=()=>{if(!video.videoWidth)return;capture.disabled=true;const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>{if(session!==generation)return;if(!blob){stop();report('Photo capture failed. Please try again.');return;}recognise(new File([blob],'address-camera.jpg',{type:'image/jpeg'}),'CAMERA_OCR');},'image/jpeg',.9);};
   }catch(error){if(session!==generation)return;stop();report(error.name==='NotAllowedError'?'Camera permission was denied. Choose a photo or type the address instead.':'Camera could not open: '+error.message);}
  };
  document.querySelector('#address-photo').onclick=()=>photo.click();cancel.onclick=()=>{stop();cancel.disabled=true;report('Address reading cancelled. You can still type the address.');};
  async function recognise(file,method){
   if(!file)return;stop();const current=++generation;cancel.disabled=false;form.confirmed.checked=false;
   try{if(!/^image\//.test(file.type)||file.size>12*1024*1024)throw Error('Choose an image under 12 MB.');if(!root.Tesseract)throw Error('Local address reader is unavailable. Please type the address.');
    source=method;report('Loading the local address reader. The first load can take a moment.');
    const local=await root.Tesseract.createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',workerBlobURL:false,cacheMethod:'none',logger:m=>{if(current===generation&&m.status)report(m.status+(typeof m.progress==='number'?' · '+Math.round(m.progress*100)+'%':''));}});
    if(current!==generation){await local.terminate();return;}worker=local;
    const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw Error('Image is too large. Take a closer photo of the address.');}
    const scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const result=await local.recognize(canvas);if(current!==generation)return;form.sourceText.value=result.data.text.slice(0,12000);suggest();
   }catch(error){if(current===generation)report('Could not read this photo: '+error.message+' Enter the address manually or try a clearer JPEG/PNG photo.');}
   finally{if(current===generation){cancel.disabled=true;if(worker){await worker.terminate().catch(()=>{});worker=null;}}}
  }
  camera.onchange=()=>recognise(camera.files[0],'CAMERA_OCR');photo.onchange=()=>recognise(photo.files[0],'PHOTO_OCR');form.address.oninput=form.suburb.oninput=form.postcode.oninput=()=>{form.confirmed.checked=false;};
  form.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(form));b.confirmed=form.confirmed.checked;b.source=source;b.parcelCount=Number(b.parcelCount||1);b.serviceMinutes=Number(b.serviceMinutes||4);if(!b.confirmed){report('Confirm the address before saving.');return;}if(worker){report('Wait for address reading to finish, or cancel it first.');return;}
   const digest=JSON.stringify(b);if(digest!==pendingDigest){pendingDigest=digest;requestKey=crypto.randomUUID();}const button=form.querySelector('button:not([type="button"])');button.disabled=true;
   try{const response=await fetch('/api/v1/address-drafts',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Idempotency-Key':requestKey},body:JSON.stringify(b)});const result=await response.json();if(!response.ok)throw Error(result.error?.message||'Could not save address.');requestKey=null;pendingDigest=null;message(result.message);await render();}catch(error){report(error.message+' Retry will reuse this address request safely.');}finally{if(button.isConnected)button.disabled=false;}
  };
 }
 root.IFOROSAddress={mount,stop,parseAddressText};if(root.addEventListener){root.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});}
 if(typeof module!=='undefined')module.exports={parseAddressText};
})(typeof window==='undefined'?{}:window);