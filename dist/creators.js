(function(root){
 const norm=name=>String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.sort().join(' ')||'';
 function reference(value){try{
  const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
  let match;
  if(u.hostname==='open.spotify.com'&&(match=u.pathname.match(/^\/artist\/([a-zA-Z0-9]{22})\/?$/)))return {provider:'spotify',id:match[1]};
  if(u.hostname==='myanimelist.net'&&(match=u.pathname.match(/^\/anime\/producer\/([1-9][0-9]*)\/?$/)))return {provider:'mal_studio',id:match[1]};
  if(u.hostname==='music.apple.com'&&(match=u.pathname.match(/^\/(?:[a-z]{2}\/)?artist\/(?:[^/]+\/)?([1-9][0-9]*)\/?$/)))return {provider:'apple',id:match[1]};
  if(u.hostname==='www.igdb.com'&&(match=u.pathname.match(/^\/companies\/([1-9][0-9]*)\/?$/)))return {provider:'igdb',id:match[1]};
  if(['www.themoviedb.org','themoviedb.org'].includes(u.hostname)&&(match=u.pathname.match(/^\/company\/([1-9][0-9]*)(?:-[^/]*)?\/?$/)))return {provider:'tmdb_company',id:match[1]};
  if(u.hostname==='vndb.org'&&(match=u.pathname.match(/^\/([sp][1-9][0-9]*)\/?$/)))return {provider:'vndb',id:match[1]};
  if(['www.themoviedb.org','themoviedb.org'].includes(u.hostname)&&(match=u.pathname.match(/^\/person\/([1-9][0-9]*)(?:-[^/]*)?\/?$/)))return {provider:'tmdb',id:match[1]};
  if(u.hostname==='openlibrary.org'&&(match=u.pathname.match(/^\/authors\/(OL[1-9][0-9]*A)(?:\/[^/]*)?\/?$/)))return {provider:'openlibrary',id:match[1]};
  if(u.hostname==='musicbrainz.org'&&(match=u.pathname.match(/^\/artist\/([0-9a-f-]{36})\/?$/i))&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(match[1]))return {provider:'musicbrainz',id:match[1]};
  if(['www.mangaupdates.com','mangaupdates.com'].includes(u.hostname)){
   if((match=u.pathname.match(/^\/author\/([a-z0-9]{1,10})(?:\/[^/]*)?\/?$/))){const id=parseInt(match[1],36);if(Number.isSafeInteger(id)&&id>0)return {provider:'mangaupdates',id:String(id)};}
   if(u.pathname==='/author.html'&&/^[1-9][0-9]*$/.test(u.searchParams.get('id')||''))return {provider:'mangaupdates',id:u.searchParams.get('id')};
  }
 }catch{}return null;}
 const key=ref=>ref.provider+':'+ref.id;
 const company=ref=>ref&&(['igdb','tmdb_company','mal_studio'].includes(ref.provider)||(ref.provider==='vndb'&&ref.id.startsWith('p')));
 function companyMatches(refs,name){return ['igdb','tmdb_company'].flatMap(provider=>{const exact=refs.filter(r=>r.provider===provider&&norm(r.name)===norm(name));return exact.length===1?exact:[];});}
 function entityLinks(ref){return new Set((ref?.entity_links||[]).flatMap(link=>{try{const native=reference(link);if(native)return ['creator:'+key(native)];const u=new URL(link);if(u.protocol!=='https:'||u.username||u.password)return [];const host=u.hostname.replace(/^www\./,'');if(['twitter.com','x.com','facebook.com','instagram.com','youtube.com','twitch.tv'].includes(host)&&u.pathname==='/')return [];return [host+u.pathname.replace(/\/$/,'')];}catch{return [];}}));}
 function linkedEntity(a,b){const left=entityLinks(a);return [...entityLinks(b)].some(link=>left.has(link));}
 function studioWorks(rows,url){return rows.filter(m=>(m.credits||[]).some(c=>c.role==='Studio'&&c.url===url));}
 function studioAnchors(origin,related){return [...new Map([origin,...related].filter(Boolean).map(m=>[m.id||m.source.provider+':'+m.source.id,m])).values()].sort((a,b)=>(a.release_date||'9999').localeCompare(b.release_date||'9999')).slice(0,3);}
 if(typeof module==='object')module.exports={reference,norm,studioWorks,companyMatches,studioAnchors,linkedEntity};
 if(typeof document==='undefined')return;
 const dialog=document.createElement('dialog');dialog.id='creator-dialog';dialog.setAttribute('aria-labelledby','creator-name');document.body.append(dialog);
 let displayed=[],generation=0,controller,origin,name='',matches=[],sources=new Map(),pending=new Set(),kind='',finding=false,relatedWorks=[],refreshing=false,creatorSort='popular';
 const labels={mal_studio:'MyAnimeList studio',spotify:'Spotify',apple:'Apple Music',igdb:'IGDB company',tmdb_company:'TMDB company',vndb:'VNDB',tmdb:'TMDB',mangaupdates:'MangaUpdates',musicbrainz:'MusicBrainz',openlibrary:'Open Library'};
 function shell(){dialog.innerHTML=`<header class="creator-header"><div><small>CREATOR WORKS</small><h2 id="creator-name">${esc(name)}</h2><p>Explore their work, across your library and connected catalogs.</p></div><button type="button" class="creator-close" aria-label="Close creator works"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><section class="creator-profile" aria-label="Creator overview"></section><p class="creator-loading" role="status" hidden>Looking up connected works and creator catalogs…</p><p id="creator-status" role="status">Loading works…</p><p id="creator-error" role="alert" hidden></p><div class="creator-toolbar"><button type="button" class="creator-refresh">↻ Refresh all catalogs</button><label>Media<select id="creator-kind"><option value="">All media</option>${Object.entries(mediaTypes).map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('')}</select></label><label>Sort<select id="creator-sort"><option value="popular">Popular first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label></div><div id="creator-sources"></div><div id="creator-results" class="creator-results"></div><div id="creator-more"></div><details class="creator-cross-media"><summary>Other catalogs & matching creators</summary><h3>Explore other media</h3><p>Possible creator matches from other sources. Check the name and profile before including their works.</p><div id="creator-matches" class="creator-matches"></div><p id="creator-match-status" role="status">Looking for creator matches…</p></details>`;
  dialog.querySelector('.creator-refresh').onclick=refresh;dialog.querySelector('#creator-sort').value=creatorSort;dialog.querySelector('#creator-sort').onchange=e=>{creatorSort=e.target.value;paint();};
  dialog.querySelector('.creator-cross-media').insertAdjacentHTML('beforeend','<details class="creator-other-names"><summary>Other name matches</summary><div id="creator-other-matches" class="creator-matches"></div></details>');
  dialog.querySelector('.creator-close').onclick=()=>dialog.close();dialog.querySelector('#creator-kind').onchange=e=>{kind=e.target.value;paint();};
 }
 function busy(){const loading=refreshing||finding||pending.size>0;dialog.querySelector('.creator-loading').hidden=!loading;dialog.querySelector('#creator-results').setAttribute('aria-busy',String(loading));dialog.querySelector('.creator-refresh').disabled=loading||refreshing;}
 function savedWorks(){const href=reference(origin?.url)?origin.url:'';return items.filter(x=>{
  const m=x.metadata;return m&&(href?(m.credits||[]).some(c=>c.url===href):(m.credits||[]).some(c=>norm(c.name)===norm(name))||(m.creators||[]).some(n=>norm(n)===norm(name))||norm(x.creator)===norm(name));
 }).map(x=>x.metadata).concat(origin?.media?[origin.media]:[],relatedWorks);}
 function profile(){
  const refs=[...sources.values()].map(s=>s.ref),ref=refs.find(r=>r.description)||refs.find(r=>r.image_url)||refs[0],portrait=refs.find(r=>r.image_url);
  const panel=dialog.querySelector('.creator-profile');if(!panel)return;const biographyOpen=panel.querySelector('.creator-biography')?.open??true;
  const clean=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/\[\/?(?:url|b|i|u|spoiler)(?:=[^\]]*)?\]/gi,'').trim();
  panel.innerHTML=ref?`${safeArt(portrait?.image_url)?`<a class="creator-profile-portrait" href="${esc(safeMediaUrl(portrait.url)||'#')}" target="_blank" rel="noopener noreferrer"><img src="${esc(safeArt(portrait.image_url))}" alt="${esc(name)}" referrerpolicy="no-referrer"><small>${esc(labels[portrait.provider])} ↗</small></a>`:''}<div><small>OVERVIEW</small>${ref.description?`<details class="creator-biography"><summary>About ${esc(name)}</summary><p>${esc(clean(ref.description))}</p></details>`:'<p>Explore releases, credits, and connected works. This catalog has not supplied a biography.</p>'}<dl>${Object.entries(ref.facts||{}).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(label==='Type'?FolioMetadataDisplay.label(value):value)}</dd></div>`).join('')}</dl><a href="${esc(safeMediaUrl(ref.url)||'#')}" target="_blank" rel="noopener noreferrer">Profile on ${esc(labels[ref.provider])} ↗</a></div>`:(finding||pending.size?'<p role="status">Loading creator overview…</p>':'<p>No profile information is currently available. Your saved works remain below; other catalogs can be included.</p>');const biography=panel.querySelector('.creator-biography');if(biography)biography.open=biographyOpen;
 }
 function paint(){
  busy();
  profile();
  const rows=FolioIdentity.editions(FolioIdentity.group([...savedWorks(),...[...sources.values()].flatMap(s=>s.results||[])])).filter(m=>FolioIdentity.matchesKind(m,kind));
  displayed=rows;rows.sort((a,b)=>(creatorSort==='title'?a.title.localeCompare(b.title):creatorSort==='oldest'?(a.release_date||'9999').localeCompare(b.release_date||'9999'):creatorSort==='popular'?((b.rating_count||0)-(a.rating_count||0)||(b.search_priority||0)-(a.search_priority||0)||(b.popularity||0)-(a.popularity||0)):0)||(b.release_date||'').localeCompare(a.release_date||'')||a.title.localeCompare(b.title));
  dialog.querySelector('#creator-results').innerHTML=rows.map((m,i)=>{const image=imageFor(m),entry=owned(fromMetadata(m));return `<article class="creator-work"><button class="creator-work-open" data-creator-work="${i}" aria-label="Preview ${esc(m.title)}">${image?`<img src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="creator-work-placeholder" aria-hidden="true">${esc(m.title.slice(0,1))}</span>`}<div><small>${esc(mediaTypes[m.kind]||m.kind)} · ${esc(m.release_date?.slice(0,4)||'Year unknown')}</small><h3>${esc(m.title)}</h3><small>${esc(sourceNames(m))}${entry?' · In your library':''}</small>${entry?.status==='Completed'?'<span class="creator-completed">✓ Completed</span>':''}</div></button></article>`;}).join('')||(finding||refreshing||pending.size?'<p class="info-empty">Checking connected catalogs for this media type…</p>':'<p class="info-empty">No works reported for this media filter. Other catalogs are available below.</p>');
  dialog.querySelectorAll('[data-creator-work]').forEach(button=>button.onclick=async()=>{
   const media=rows[Number(button.dataset.creatorWork)];root.FolioDirectory?.before();dialog.close();for(const d of document.querySelectorAll('#detail[open],#live-detail[open]'))d.close();
   await showLive(media);if(!liveDialog.open)return;
   if(!root.FolioDirectory){const back=document.createElement('button');back.type='button';back.className='creator-return';back.textContent='← Back to '+name+'’s works';back.onclick=()=>{liveDialog.close();paint();dialog.showModal();};liveDialog.prepend(back);}
  });
  dialog.querySelector('#creator-status').textContent=`${rows.length} loaded ${rows.length===1?'work':'works'}${kind?' in this media type':''}.${reference(origin?.url)?.provider==='mal_studio'?' Verified MAL studio credits; connected catalogs are included when a shared work confirms the studio.':''}`;
  dialog.querySelector('#creator-sources').innerHTML=[...sources].map(([id,s])=>`<div class="creator-source"><span>${esc(s.ref.name)} · ${esc(labels[s.ref.provider])}</span><a href="${esc(safeMediaUrl(s.ref.url)||'#')}" target="_blank" rel="noopener noreferrer" aria-label="Source profile for ${esc(s.ref.name)} on ${esc(labels[s.ref.provider])}">↗</a><button type="button" data-remove-creator="${esc(id)}" aria-label="Remove works from ${esc(s.ref.name)} on ${esc(labels[s.ref.provider])}">×</button></div>`).join('');
  dialog.querySelectorAll('[data-remove-creator]').forEach(b=>b.onclick=()=>{sources.delete(b.dataset.removeCreator);paint();});
  dialog.querySelector('#creator-more').innerHTML=[...sources].filter(([,s])=>s.more).map(([id,s])=>`<button type="button" data-more-creator="${esc(id)}">More from ${esc(labels[s.ref.provider])}</button>`).join('');
  dialog.querySelectorAll('[data-more-creator]').forEach(b=>b.onclick=()=>load(sources.get(b.dataset.moreCreator).ref,true,b));
  const matchButton=(ref,i)=>sources.has(key(ref))?'':`<div class="creator-match-option"><button type="button" data-creator-match="${i}" ${sources.has(key(ref))||pending.has(key(ref))?'disabled':''}>${esc(ref.name)} \u00b7 ${esc(labels[ref.provider])}${sources.has(key(ref))?' \u00b7 Included':pending.has(key(ref))?' \u00b7 Loading…':' \u00b7 Include works'}</button><a class="creator-match-profile" href="${esc(safeMediaUrl(ref.url)||'#')}" target="_blank" rel="noopener noreferrer" aria-label="Check ${esc(ref.name)} profile on ${esc(labels[ref.provider])}">Profile ↗</a></div>`;
  dialog.querySelector('#creator-matches').innerHTML=matches.map((ref,i)=>norm(ref.name)===norm(name)?matchButton(ref,i):'').join('');
  dialog.querySelector('#creator-other-matches').innerHTML=matches.map((ref,i)=>norm(ref.name)!==norm(name)?matchButton(ref,i):'').join('');
  dialog.querySelector('.creator-other-names').hidden=!matches.some(ref=>norm(ref.name)!==norm(name));

  dialog.querySelectorAll('[data-creator-match]').forEach(b=>b.onclick=()=>load(matches[Number(b.dataset.creatorMatch)],false,b));
  if(dialog.open)root.FolioDirectory?.update();
 }
 function includeLinked(){for(const match of matches)if(!sources.has(key(match))&&!pending.has(key(match))&&[...sources.values()].some(s=>linkedEntity(s.ref,match)))load(match);}
 async function load(ref,append=false,button,force=false){
  const current=generation,id=key(ref);if(pending.has(id))return;pending.add(id);busy();if(button)button.disabled=true;
  const old=sources.get(id),page=append?(old?.page||1)+1:1;
  dialog.querySelector('#creator-status').textContent=`Loading works from ${labels[ref.provider]}…`;dialog.querySelector('#creator-error').hidden=true;
  try{const data=await metadataGet(`creators/${encodeURIComponent(ref.provider)}/${encodeURIComponent(ref.id)}/works?page=${page}`,controller.signal,force);if(current!==generation)return;
   sources.set(id,{ref:data.creator,page,more:data.more,results:append?[...(old?.results||[]),...data.results]:data.results});paint();if(!append)includeLinked();
  }catch(error){if(current===generation&&error.name!=='AbortError'){const warning=dialog.querySelector('#creator-error');warning.hidden=false;warning.innerHTML=esc(error.message)+' Your other loaded sources are still available. <button type="button" id="creator-retry">Retry</button>';warning.querySelector('button').onclick=e=>load(ref,append,e.currentTarget);if(button)button.disabled=false;if(ref.provider==='mal_studio'&&!append)loadRelated(current,force);}}finally{if(current===generation){pending.delete(id);busy();profile();dialog.querySelectorAll('[data-creator-match]').forEach(b=>{const ref=matches[Number(b.dataset.creatorMatch)];b.disabled=sources.has(key(ref))||pending.has(key(ref));});}}
 }
 async function loadOrigin(current){
  const media=origin?.media;if(!media)return;
  const links=(media.credits||[]).filter(c=>norm(c.name)===norm(name)&&reference(c.url)&&reference(c.url).provider!=='mal_studio');
  for(const credit of links){const ref=reference(credit.url);if(!sources.has(key(ref))&&!pending.has(key(ref)))load({...ref,name:credit.name,url:credit.url});}
  if(!['album','track'].includes(media.kind))return;
  const spotify=(media.media_links||[]).flatMap(link=>{try{const u=new URL(link.url),hit=u.pathname.match(/^\/(album|track)\/([a-zA-Z0-9]{22})\/?$/);return u.protocol==='https:'&&u.hostname==='open.spotify.com'&&hit&&hit[1]===media.kind?[hit[2]]:[];}catch{return [];}})[0];if(!spotify)return;
  pending.add('origin-links');busy();
  try{const linked=await metadataGet('items/spotify/'+media.kind+'/'+spotify+'?enrich=false',controller.signal);if(current!==generation)return;if(!FolioIdentity.same(media,linked))return;for(const c of linked.credits||[]){const ref=reference(c.url);if(ref&&norm(c.name)===norm(name)&&!sources.has(key(ref))&&!pending.has(key(ref)))load({...ref,name:c.name,url:c.url});}}
  catch{/* Source-qualified credits remain usable when another catalog is unavailable. */}
  finally{if(current===generation){pending.delete('origin-links');busy();profile();}}
 }
 async function loadRelated(current,force=false){
  const id='native-studio';pending.add(id);busy();
  try{if(force&&origin.media)origin.media=await getDetail(origin.media,true);if(current!==generation)return;const refs=[...new Map(FolioIdentity.records(origin.media||{}).flatMap(m=>m.related_media||[]).filter(r=>r.provider==='mal'&&r.kind==='anime').map(r=>[r.id,r])).values()].slice(0,6);
   const batches=await Promise.allSettled(refs.map(r=>metadataGet('items/mal/anime/'+encodeURIComponent(r.id)+'?enrich=false',controller.signal,force)));
   if(current!==generation)return;
   relatedWorks=studioWorks(batches.filter(r=>r.status==='fulfilled').map(r=>r.value),origin.url);paint();
   const anchors=studioAnchors(origin.media,relatedWorks);
   for(const anchor of anchors){if(current!==generation)return;try{const linked=await getDetail(anchor,force);if(current!==generation)return;for(const credit of linked.credits||[]){const ref=reference(credit.url);if(ref?.provider==='tmdb_company'&&norm(credit.name)===norm(name)&&!sources.has(key(ref)))await load({...ref,name:credit.name,url:credit.url});}if([...sources.values()].some(s=>s.ref.provider==='tmdb_company'))break;}catch{ /* Keep verified MAL credits when cross-catalog evidence is unavailable. */ }}
   dialog.querySelector('#creator-status').textContent+=' Related titles are included only when their MAL studio ID matches. Other catalogs are available below.';
  }catch(error){if(current===generation&&error.name!=='AbortError')dialog.querySelector('#creator-status').textContent='Related-title lookup is unavailable. Include a catalog match above for more works.';}
  finally{if(current===generation){pending.delete(id);busy();}}
 }
 async function refresh(){
  if(refreshing||pending.size||finding)return;refreshing=true;busy();const scroll=dialog.scrollTop,current=generation;
  const loaded=[...sources.values()].map(s=>({ref:s.ref,pages:s.page}));
  try{const outcomes=await Promise.allSettled(loaded.map(async s=>{const batches=[];for(let page=1;page<=s.pages;page++){const data=await metadataGet(`creators/${encodeURIComponent(s.ref.provider)}/${encodeURIComponent(s.ref.id)}/works?page=${page}`,controller.signal,true);batches.push(data);}if(current===generation){const last=batches.at(-1);sources.set(key(s.ref),{ref:last.creator,page:s.pages,more:last.more,results:batches.flatMap(d=>d.results)});}}));
   if(current!==generation)return;
   const data=await metadataGet('creators/find?q='+encodeURIComponent(name.slice(0,120)),controller.signal,true);if(current!==generation)return;matches=data.matches;paint();dialog.scrollTop=scroll;
   dialog.querySelector('#creator-status').textContent+=' · Refreshed just now.';dialog.querySelector('#creator-match-status').textContent=outcomes.some(o=>o.status==='rejected')?'Some catalogs could not refresh. Previously loaded works were kept.':'Catalogs refreshed. Provider rate limits still apply.';
  }catch(error){if(current===generation&&error.name!=='AbortError')dialog.querySelector('#creator-match-status').textContent='Some catalogs could not refresh. Previously loaded works were kept.';}
  finally{if(current===generation){refreshing=false;busy();}}
 }
 async function open(button){
  root.FolioDirectory?.before();
  controller?.abort();controller=new AbortController();const current=++generation;origin={url:button.dataset.creatorUrl,media:typeof FolioMediaInfo!=='undefined'?FolioMediaInfo.forElement?.(button):null};name=button.dataset.creatorName;matches=[];sources=new Map();pending=new Set();kind='';finding=true;refreshing=false;relatedWorks=[];shell();paint();dialog.showModal();root.FolioDirectory?.visit();
  const ref=reference(origin.url);if(ref)load({...ref,name,url:origin.url});else dialog.querySelector('#creator-status').textContent='Showing known library credits. Choose a source match below to load more works.';loadOrigin(current);
  try{const data=await metadataGet('creators/find?q='+encodeURIComponent(name.slice(0,120)),controller.signal);if(current!==generation)return;
   matches=[...(ref&&ref.provider!=='mal_studio'?[{...ref,name,url:origin.url}]:[]),...data.matches.filter(r=>!ref||key(r)!==key(ref))].sort((a,b)=>Number(norm(b.name)===norm(name))-Number(norm(a.name)===norm(name))).filter((r,i,all)=>all.findIndex(x=>key(x)===key(r))===i);paint();includeLinked();
   // Name-only company matches stay explicit; shared verified links are included above.
   const unavailable=data.providers.filter(p=>p.status!=='ok');dialog.querySelector('#creator-match-status').textContent=(matches.length?'':'No additional creator matches returned.')+(unavailable.length?' Some source catalogs are unavailable or not configured.':'');
  }catch(error){if(current===generation&&error.name!=='AbortError')dialog.querySelector('#creator-match-status').textContent='Other-source lookup is unavailable. Your loaded works remain usable.';}finally{if(current===generation){finding=false;busy();profile();}}
 }
 document.addEventListener('click',e=>{const button=e.target.closest('.creator-chip');if(button)open(button);});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 root.FolioCreators={open,reference,forElement:element=>displayed[Number(element.closest('[data-creator-work]')?.dataset.creatorWork)],snapshot:()=>dialog.open?{origin,name,matches,sources:[...sources],kind,relatedWorks,sort:creatorSort,scroll:dialog.scrollTop}:null,restore:state=>{controller?.abort();controller=new AbortController();generation++;({origin,name,matches,kind,relatedWorks}=state);creatorSort=state.sort||'popular';sources=new Map(state.sources);pending=new Set();finding=false;refreshing=false;shell();paint();dialog.showModal();dialog.scrollTop=state.scroll||0;}};
})(globalThis);
