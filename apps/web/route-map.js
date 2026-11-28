function mountRouteMaps(){
 document.querySelectorAll('.run-summary svg').forEach(svg=>{
  if(svg.dataset.interactive)return;svg.dataset.interactive='true';svg.setAttribute('tabindex','0');svg.setAttribute('aria-label','Interactive road route. Use zoom buttons or arrow keys to pan.');
  const box=document.createElement('div');box.className='interactive-map';svg.before(box);box.append(svg);
  const controls=document.createElement('div');controls.className='map-controls';controls.innerHTML='<button type="button" data-map="in" aria-label="Zoom in">＋</button><button type="button" data-map="out" aria-label="Zoom out">−</button><button type="button" data-map="fit">Fit route</button><button type="button" data-map="full">Full screen</button>';box.prepend(controls);
  const hint=document.createElement('p');hint.className='map-hint';hint.textContent='Drag to move · Pinch or scroll to zoom · Tap a numbered stop';box.append(hint);
  let x=0,y=0,w=600,h=360;const pointers=new Map();let previousDistance=null;
  const apply=()=>svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
  const zoom=factor=>{const next=Math.min(1800,Math.max(100,w*factor));x+=(w-next)/2;y+=(h-next*.6)/2;w=next;h=next*.6;apply();};
  controls.onclick=e=>{const action=e.target.dataset.map;if(action==='in')zoom(.8);if(action==='out')zoom(1.25);if(action==='fit'){x=0;y=0;w=600;h=360;apply();}if(action==='full'){if(document.fullscreenElement)document.exitFullscreen();else if(box.requestFullscreen)box.requestFullscreen().catch(()=>message('Full screen is unavailable in this browser.',true));}};
  svg.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?.9:1.1);};
  svg.onpointerdown=e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const last=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const rect=svg.getBoundingClientRect();if(pointers.size===1){x-=(e.clientX-last.x)*w/rect.width;y-=(e.clientY-last.y)*h/rect.height;apply();}else{const ps=[...pointers.values()],distance=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);if(previousDistance&&distance>0)zoom(previousDistance/distance);previousDistance=distance;}};
  svg.onpointerup=svg.onpointercancel=e=>{pointers.delete(e.pointerId);previousDistance=null;};
  svg.onkeydown=e=>{if(e.key==='+')zoom(.8);else if(e.key==='-')zoom(1.25);else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();x+=e.key==='ArrowLeft'?-w/10:e.key==='ArrowRight'?w/10:0;y+=e.key==='ArrowUp'?-h/10:e.key==='ArrowDown'?h/10:0;apply();}};
  svg.querySelectorAll('g').forEach(marker=>{marker.style.cursor='pointer';marker.onclick=()=>{const n=Number(marker.querySelector('text')?.textContent);const card=document.querySelectorAll('.stop-card')[n-1];if(card){hint.textContent=`Stop ${n}: ${card.querySelector('h3').textContent}`;card.classList.add('highlight-stop');setTimeout(()=>card.classList.remove('highlight-stop'),2500);}};});
 });
}
