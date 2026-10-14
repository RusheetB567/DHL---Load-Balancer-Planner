/* Presentation layer: existing server-authorized workflows remain the source of truth. */
const icons={overview:'▦',imports:'↓',scanning:'⌁',runboard:'⇄',driver:'➜',receiving:'✓',clearances:'◇',exceptions:'!',audit:'↺'};
const labels={overview:'Today',imports:'Import parcels',scanning:'Check in parcels',runboard:'Plan & assign runs',driver:'My route',receiving:'Missing parcels',clearances:'Freight holds',exceptions:'Needs attention',audit:'Activity history'};
document.querySelectorAll('nav [data-view]').forEach(b=>{b.innerHTML=`<span class="nav-icon" aria-hidden="true">${icons[b.dataset.view]}</span><span>${labels[b.dataset.view]}</span>`;});
const baseExperienceRender=render;
render=async function(){
 await baseExperienceRender();
 document.body.classList.toggle('driver-mode',actor?.role==='driver');
 $('#heading').textContent=labels[view]||titles[view];
 if(view==='overview'&&actor){
  const board=await api('/planning'),m=data.metrics;
  const hero=document.createElement('div');hero.className='daily-hero';hero.innerHTML=`<div><span class="overline">NETLEY OPERATIONS</span><h2>A clear view of today.</h2><p>Check freight in. Build achievable runs. Keep drivers moving.</p><div class="hero-actions"><button data-go="scanning">＋ Check in parcels</button><button class="secondary" data-go="runboard">Plan today's runs →</button></div></div><div class="hero-date"><span>${escape(new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Adelaide',weekday:'long',day:'numeric',month:'long'}).format(new Date()))}</span><strong>${m.receivedPieces}<small> / ${m.expectedPieces}</small></strong><p>pieces received at depot</p><progress class="progress-track" value="${m.receivedPieces}" max="${m.expectedPieces||1}" aria-label="Pieces received"></progress></div>`;
  $('#content').prepend(hero);
  const runBoard=document.createElement('section');runBoard.className='today-runs';runBoard.innerHTML=`<div class="sectionhead"><div><span class="overline">DISPATCH WORKSPACE</span><h2>Your runs at a glance</h2></div><button class="text-button" data-go="runboard">Open planning →</button></div><div class="run-cards">${board.runs.map(r=>`<button class="run-preview" data-run="${r.id}"><div class="run-card-top"><span class="run-avatar">${escape(r.name.slice(0,1))}</span><span class="tag">${escape(r.status==='REHEARSAL'?'Demo list sent':r.status==='CHANGES_PENDING'?'Depot check needed':r.status==='DRAFT'?'Being planned':r.status)}</span></div><h3>${escape(r.name)}</h3><p>${r.stops.length} stops · ${r.weightKg.toFixed(0)} kg</p><div class="card-bottom"><span>${escape(board.drivers.find(d=>d.id===r.driver_id)?.name||r.driver_id)}</span><strong>View run →</strong></div></button>`).join('')||'<div class="empty">Create your first run in the planning workspace.</div>'}</div></section>`;
  const metrics=$('.metrics');metrics.after(runBoard);
  const shortcut=document.createElement('div');shortcut.className='quick-links';shortcut.innerHTML=`<button data-go="imports"><span>↓</span><div><strong>Import freight</strong><small>Bring a manifest into the depot</small></div>→</button><button data-go="receiving"><span>✓</span><div><strong>Check missing pieces</strong><small>${m.missingPieces} pieces awaiting receiving</small></div>→</button><button data-go="exceptions"><span>!</span><div><strong>Resolve exceptions</strong><small>${data.exceptions.filter(e=>e.state==='OPEN').length} open items to review</small></div>→</button>`;runBoard.after(shortcut);
 }
 if((view==='runboard'||view==='driver')&&$('.run-summary')){
  const summary=$('.run-summary'),stops=$('.stop-list');
  const layout=document.createElement('div');layout.className='planning-layout';
  const primary=document.createElement('div');primary.className='plan-primary';const side=document.createElement('div');side.className='plan-side';
  const before=summary.nextElementSibling;summary.before(layout);layout.append(primary,side);side.append(summary);
  let node=before;while(node){const next=node.nextElementSibling;if(node===layout)break;primary.append(node);node=next;}
  if(view==='driver'){
   const tabs=document.createElement('div');tabs.className='driver-steps';tabs.innerHTML='<button data-anchor=".scan-panel">1 · Scan parcels</button><button data-anchor=".stop-list">2 · My stops</button><button data-anchor=".request-card">3 · Depot messages</button>';layout.before(tabs);
   tabs.querySelectorAll('[data-anchor]').forEach(b=>b.onclick=()=>document.querySelector(b.dataset.anchor)?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  if(!summary.querySelector('svg')){const placeholder=document.createElement('div');placeholder.className='route-placeholder';placeholder.innerHTML='<span>⌁</span><h3>Your road route</h3><p>Calculate the road route to see your numbered stops here.</p>';summary.append(placeholder);}
 }
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>document.querySelector(`nav [data-view="${b.dataset.go}"]`).click());
 document.querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>{selectedRun=b.dataset.run;document.querySelector('nav [data-view="runboard"]').click();});
 // Match visible buttons to the actual account instead of exposing duplicate driver menus.
 if(actor&&actor.role!=='driver')document.querySelector('nav [data-view="driver"]').hidden=true;
 mountRouteMaps();
};
fetch('/api/demo').then(async response=>{
 if(!response.ok)return;const demo=await response.json();
 const roles=document.createElement('div');roles.className='role-choices';roles.innerHTML=`<button type="button" data-role="local-supervisor"><span>▦</span><strong>Depot workspace</strong><small>Receive freight, plan runs and support drivers</small><b>Open depot →</b></button><button type="button" data-role="local-driver"><span>➜</span><strong>Driver workspace</strong><small>Scan your parcels and follow your daily route</small><b>Open my route →</b></button>`;
 $('#login').prepend(roles);$('#login-form').hidden=true;
 roles.querySelectorAll('button').forEach(b=>b.onclick=()=>{const account=demo.users.find(u=>u.id===b.dataset.role);if(!account)return;$('#token').value=account.token;$('#login-form').requestSubmit();});
}).catch(()=>{});
