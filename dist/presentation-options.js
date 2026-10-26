(function(root){
 const layoutKey='folio-splash-layout-v1',blendKey='folio-artwork-blend-v1';
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('Could not save display preferences.');return false;}};
 let layout=read(layoutKey,'immersive'),blend=read(blendKey,'subtle');
 if(!['immersive','compact','sections'].includes(layout))layout='immersive';if(!['off','subtle','rich'].includes(blend))blend='off';
 function applySections(container){const active=container.dataset.splashSection;for(const fold of container.querySelectorAll('.detail-fold')){fold.hidden=layout==='sections'&&fold.dataset.sectionLabel!==active;if(layout==='sections'&&!fold.hidden)fold.open=true;}}
 function bind(container){
  if(!container.querySelector('.media-hero'))return;container.classList.add('media-splash');container.dataset.splashLayout=layout;
  const tools=container.querySelector('.detail-section-tools');if(!tools)return;
  if(!tools.querySelector('.splash-layout')){const label=document.createElement('label');label.className='splash-layout';label.textContent='Layout ';const select=document.createElement('select');select.setAttribute('aria-label','Media page layout');for(const [value,text] of [['immersive','Full'],['compact','Compact'],['sections','Sections']])select.add(new Option(text,value));select.value=layout;label.append(select);tools.prepend(label);select.onchange=()=>{layout=select.value;save(layoutKey,layout);for(const box of document.querySelectorAll('.media-splash'))bind(box);};}
  tools.querySelector('select').value=layout;for(const button of tools.querySelectorAll('button'))button.hidden=layout==='sections';
  let sections=container.querySelector('.splash-section-nav');if(!sections){sections=document.createElement('nav');sections.className='splash-section-nav';sections.setAttribute('aria-label','Choose media section');tools.after(sections);}
  const labels=[...new Set([...container.querySelectorAll('.detail-fold')].map(f=>f.dataset.sectionLabel))];if(!labels.includes(container.dataset.splashSection))container.dataset.splashSection=labels[0]||'';
  sections.innerHTML=labels.map(label=>`<button type="button" aria-pressed="${label===container.dataset.splashSection}">${esc(label)}</button>`).join('');
  for(const button of sections.children)button.onclick=()=>{container.dataset.splashSection=button.textContent;bind(container);};sections.hidden=layout!=='sections';applySections(container);
 }
 const previousBind=FolioDetailPresentation.bind;FolioDetailPresentation.bind=function(container){previousBind(container);bind(container);};

 function paint(){document.documentElement.dataset.cardBlend=blend;for(const card of document.querySelectorAll('[data-library-id],.discover-card')){const cover=card.querySelector('.custom-cover,.discover-art img'),art=safeArt(cover?.getAttribute('src')||'');card.style.setProperty('--card-art',art?'url('+JSON.stringify(art)+')':'none');card.dataset.artBleed=art?'true':'false';}}

 const section=document.createElement('section');section.className='preferences-section';section.innerHTML='<h3>Artwork</h3><label>Grid artwork blending<select aria-label="Grid artwork blending"><option value="off">Off</option><option value="subtle">Subtle</option><option value="rich">Expressive</option></select></label><p class="muted">The chosen cover softly bleeds into each grid tile. Yotsuba keeps plain catalog thumbnails.</p>';document.querySelector('#preferences-dialog').append(section);section.querySelector('select').value=blend;section.querySelector('select').onchange=e=>{blend=e.target.value;save(blendKey,blend);paint();};
 function editCard(){document.querySelector('#user-settings').click();section.querySelector('select').focus();}

 const previous=render;render=function(){previous();paint();};document.addEventListener('folio:search-results',paint);
 const observer=new MutationObserver(()=>paint());observer.observe(document.querySelector('#live-results'),{childList:true});paint();
 // A refresh keeps the current query and filters, and explicitly bypasses provider caches.
 const refresh=document.createElement('button');refresh.type='button';refresh.className='search-refresh';refresh.textContent='↻ Refresh results';refresh.onclick=()=>{if(liveEl('live-query').value.trim())loadResults(false,true);else liveEl('live-query').focus();};document.querySelector('.search-browse-controls').append(refresh);
 root.FolioPresentation={bind,paint,editCard};
})(globalThis);
