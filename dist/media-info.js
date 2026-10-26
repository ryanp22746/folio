/* Provider detail panels shared by search previews and saved library entries. */
(function(root){
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const url=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username?u.href:'';}catch{return '';}};
const link=(label,href,cls='info-chip')=>url(href)?`<a class="${cls}" href="${esc(url(href))}" target="_blank" rel="noopener noreferrer">${label}</a>`:`<span class="${cls}">${label}</span>`;
const icon=name=>`<svg class="detail-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${({play:'<path d="m9 5 11 7-11 7Z"/>',external:'<path d="M14 4h6v6M20 4 10 14"/><path d="M10 4H4v16h16v-6"/>',screen:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>'})[name]||''}</svg>`;
const empty=text=>`<p class="info-empty">${esc(text)}</p>`;
const country=code=>{try{return new Intl.DisplayNames(['en'],{type:'region'}).of(code)||code;}catch{return code;}};
const snapshots=new Map();let sequence=0;
function region(){try{return localStorage.getItem('folio-watch-region')||'US';}catch{return 'US';}}
function offers(m,code){
 const record=m.watch_regions?.[code],href=url(record?.url),rows=record?.offers||[];
 const note=m.watch_status==='unavailable'?'Availability is temporarily unavailable. Refresh details to try again.':m.watch_status!=='ok'?'Refresh details to load regional availability.':`No streaming, rental or purchase options reported for ${country(code)}. This does not prove the title is unavailable.`;
 const grouped=new Map();for(const row of rows){const key=row.name;if(!grouped.has(key))grouped.set(key,{...row,types:[]});const entry=grouped.get(key);if(!entry.types.includes(row.type))entry.types.push(row.type);}
 return `<div class="watch-service-list">${[...grouped.values()].map(row=>link(`${url(row.logo_url)?`<img src="${esc(url(row.logo_url))}" alt="" width="32" height="32" loading="lazy">`:`<span class="service-mark" aria-hidden="true">${esc(row.name.slice(0,1))}</span>`}<span class="watch-service-name">${esc(row.name)}</span><span class="watch-types">${row.types.map(t=>`<small>${esc(t)}</small>`).join('')}</span>${href?icon('external'):''}`,href,'watch-service')).join('')||empty(note)}</div>${href?link('All services & viewing links '+icon('external'),href,'watch-all'):''}<p class="discover-note">Availability by ${link('JustWatch','https://www.justwatch.com/','availability-credit')} via TMDB · ${esc(code)} · Fetched ${esc(m.source?.fetched_at?new Date(m.source.fetched_at).toLocaleDateString():'on provider refresh')}. Open a service row to choose a viewing link. Offers can change; prices and video quality are not supplied.</p>`;
}
function watch(m,id){
 if(['Collection','Season','Episode'].includes(m.format))return ''; // No title-wide availability claim for individual parts.
 const cinematic=[m,...(m.source_records||[])].some(r=>r.source?.provider==='tmdb')&&['movie','tv','anime'].includes(m.kind);
 if(cinematic){const code=region(),codes=[...new Set(['US',code,...Object.keys(m.watch_regions||{})])].sort((a,b)=>country(a).localeCompare(country(b)));
 return `<section class="media-watch" data-watch-id="${id}"><div class="info-section-heading"><h3>${icon('screen')}Where to watch</h3>${url(m.trailer_url)?link(icon('play')+'Trailer',m.trailer_url,'watch-trailer'):''}</div><label class="watch-country">Country<select class="watch-region" aria-label="Availability country">${codes.map(c=>`<option value="${esc(c)}" ${c===code?'selected':''}>${esc(country(c))} (${esc(c)})</option>`).join('')}</select></label><div class="watch-offers" aria-live="polite">${offers(m,code)}</div></section>`;}
 const links=[...(m.media_links||[])];
 if(/^\d+$/.test(m.external_ids?.steam||''))links.push({label:'Steam · Store page',url:`https://store.steampowered.com/app/${m.external_ids.steam}/`});
 if(/^\d+$/.test(m.external_ids?.apple||''))links.push({label:'Apple Music · Listen',url:m.source?.provider==='apple'?m.source.url:`https://music.apple.com/us/album/${m.external_ids.apple}`});
 if(m.source?.provider==='openlibrary')links.push({label:'Open Library · Editions & borrowing options',url:m.source.url});
 const music=['album','track'].includes(m.kind);
 if(music){const query=encodeURIComponent([m.title,...(m.creators||[])].filter(Boolean).join(' '));if(!links.some(l=>{try{return new URL(l.url).hostname==='open.spotify.com';}catch{return false;}}))links.push({label:'Spotify · Search title & artist',url:'https://open.spotify.com/search/'+query});links.push({label:'YouTube Music · Search title & artist',url:'https://music.youtube.com/search?q='+query});}
 const unique=[...new Map(links.filter(l=>url(l.url)).map(l=>[l.url,l])).values()];
 return `<section class="media-watch"><div class="info-section-heading"><h3>${music?'Where to listen':['game','visual_novel'].includes(m.kind)?'Where to play':['book','manga'].includes(m.kind)?'Where to read':m.kind==='anime'?'Where to watch':'Where to find it'}</h3></div>${unique.length?`<div class="watch-service-list">${unique.map(l=>link((new URL(l.url).hostname==='open.spotify.com'?'<svg class="service-spotify" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M8 12c6-2 11-1 16 1M9 17c5-2 10-1 14 1M10 22c4-1 8-1 11 1" fill="none" stroke="var(--surface)" stroke-width="2" stroke-linecap="round"/></svg>':new URL(l.url).hostname==='store.steampowered.com'?'<img src="/assets/steam.svg" alt="" width="32" height="32">':'<span class="service-mark" aria-hidden="true">'+(music?'♫':['game','visual_novel'].includes(m.kind)?'<svg class="detail-icon" viewBox="0 0 24 24"><path d="M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3C2 17 4 7 7 7Z"/><path d="M8 9v5m-2-2h4m5-1h.1m2 2h.1"/></svg>':'▤')+'</span>')+'<span class="watch-service-name">'+esc(l.label)+'</span>'+icon('external'),l.url,'watch-service')).join('')}</div><p class="discover-note">${music?'Provider-linked pages and title/artist searches. Search results are not verified matches; editions and regional access may vary.':'Linked to this provider record. Price, stock and access in your country are not verified.'}</p>`:empty('This provider has not supplied a linked store or access page. You can add your own link in library properties.')}</section>`;
}
const profiles={
 movie:{people:'Crew',details:'Film details',genres:'Genres',releases:'Releases',date:'Release date',first:'First release',creator:'Creator',cast:'Cast'},
 tv:{people:'Creators & crew',details:'Series details',genres:'Genres',releases:'Air dates',date:'First aired',first:'First aired',creator:'Creator',cast:'Cast'},
 anime:{people:'Staff',details:'Anime details',genres:'Genres',releases:'Release dates',date:'First released',first:'First release',creator:'Creator',cast:'Voice cast'},
 game:{people:'Studios & credits',details:'Game details',genres:'Genres',releases:'Release dates',date:'First released',first:'First release',creator:'Company'},
 visual_novel:{people:'Developers & staff',details:'Novel details',genres:'Genres & tags',releases:'Release dates',date:'First released',first:'First release',creator:'Developer',cast:'Voice cast'},
 album:{people:'Artists & credits',details:'Album details',genres:'Genres',releases:'Editions & releases',date:'First released',first:'First release',creator:'Artist'},
 track:{people:'Artists & credits',details:'Recording details',genres:'Genres',releases:'Releases',date:'First released',first:'First release',creator:'Artist'},
 book:{people:'Authors & contributors',details:'Book details',genres:'Genres',releases:'Publication history',date:'First published',first:'First publication',creator:'Author'},
 manga:{people:'Authors & artists',details:'Publication details',genres:'Genres',releases:'Publication history',date:'First published',first:'First publication',creator:'Creator'}
};
function render(m,genres){
 const detailGenres=[...(genres||[]),...(m.content_tags||[])];
 const id='media-info-'+(++sequence);snapshots.set(id,m);while(snapshots.size>64)snapshots.delete(snapshots.keys().next().value);
 const profile={...(profiles[m.kind]||{people:'Credits',details:'Details',genres:'Genres',releases:'Releases',date:'Release date',first:'First release',creator:'Creator'})};
 if(m.kind==='album'&&m.source?.provider==='apple'){profile.date='Catalog release date';profile.first='Catalog release';}
 if(m.kind==='album'&&m.format&&m.format!=='Album')profile.details='Music release details';
 const canonical=new Map();for(const c of m.credits||[]){if(!c.name)continue;const key=JSON.stringify([c.role||'',c.name.normalize('NFKC').toLocaleLowerCase(),c.character||'',c.note||'']);const prior=canonical.get(key);if(!prior||(!prior.url&&c.url))canonical.set(key,c);}
 const credits=[...canonical.values()],cast=profile.cast?credits.filter(c=>c.role==='Cast'):[],crew=credits.filter(c=>c.role!=='Cast');
 const facts={'Media type':({movie:'Movie',tv:'TV series',game:'Game',visual_novel:'Visual novel',album:m.source?.provider==='musicbrainz'?'Music release group':'Album',track:'Recording',book:'Book',anime:'Anime',manga:'Manga'})[m.kind]||m.kind,...(m.facts||{})};
 if(m.release_date)facts[profile.date]=m.release_date;
 if(m.format&&!Object.values(facts).includes(m.format))facts.Format=m.format;
 if(m.original_title&&m.original_title!==m.title)facts['Original title']=m.original_title;
 if(m.alternative_titles?.length)facts['Alternative titles']=[...new Set(m.alternative_titles)].join(' \u00b7 ');
 const groups=new Map();for(const c of crew){const role=c.role||'Contributor';if(!groups.has(role))groups.set(role,[]);groups.get(role).push(c);}
 // Keep explicitly credited roles; creator fallback only fills names not already credited.
 const credited=new Set(credits.map(c=>c.name.toLocaleLowerCase()));
 const creators=[...new Set(m.creators||[])].filter(name=>name&&!credited.has(name.toLocaleLowerCase()));
 if(creators.length){if(!groups.has(profile.creator))groups.set(profile.creator,[]);groups.get(profile.creator).push(...creators.map(name=>({name})));}
 const person=c=>`<button type="button" class="info-chip creator-chip" data-creator-name="${esc(c.name)}" data-creator-url="${esc(url(c.url))}" aria-label="Explore works by ${esc(c.name)}" ${c.note?`title="${esc(c.note)}" aria-description="${esc(c.note)}"`:''}>${esc(c.name)}${c.character?`<small>${esc(c.character)}</small>`:''}</button>`;
 const people=rows=>`<div class="info-chips">${rows.slice(0,6).map(person).join('')}</div>${rows.length>6?`<details class="credit-more"><summary>Show ${rows.length-6} more credits</summary><div class="info-chips">${rows.slice(6).map(person).join('')}</div></details>`:''}`;
 const factList=rows=>`<dl class="info-facts">${Object.entries(rows).filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(typeof FolioMetadataDisplay!=='undefined'?FolioMetadataDisplay.fact(label,value):value)}</dd></div>`).join('')}</dl>`;
 const sections=[];
 if(cast.length&&m.kind!=='visual_novel')sections.push([profile.cast,people(cast)]);
 if(groups.size)sections.push([profile.people,`<dl class="info-facts">${[...groups].map(([role,rows])=>`<div><dt>${esc(role)}</dt><dd>${people(rows)}</dd></div>`).join('')}</dl>`]);
 if(cast.length&&m.kind==='visual_novel')sections.push([profile.cast,people(cast)]);
 // Games and visual novels describe how/where they run, rather than film production.
 const gameplay={};if(['game','visual_novel'].includes(m.kind)){
  if(m.platforms?.length)gameplay.Platforms=m.platforms.map(p=>typeof FolioMetadataDisplay!=='undefined'?FolioMetadataDisplay.label(p):p).join(' \u00b7 ');
  for(const key of ['Game modes','Perspective','Themes','Typical length'])if(facts[key]){gameplay[key]=facts[key];delete facts[key];}
 }else if(m.platforms?.length)facts.Platforms=m.platforms.map(p=>typeof FolioMetadataDisplay!=='undefined'?FolioMetadataDisplay.label(p):p).join(' \u00b7 ');
 sections.push([profile.details,factList(facts)]);
 if(Object.keys(gameplay).length)sections.push([m.kind==='game'?'Platforms & gameplay':'Playing information',factList(gameplay)]);
 if(detailGenres.length)sections.push([profile.genres,`<div class="info-chips">${(typeof FolioMetadataDisplay!=='undefined'?FolioMetadataDisplay.genres(detailGenres):[...new Set(detailGenres)]).map(g=>`<span class="info-chip">${esc(g)}</span>`).join('')}</div>`]);
 const releaseRows=(m.releases||[]).filter(r=>r.date);
 if(!releaseRows.length&&m.release_date)releaseRows.push({date:m.release_date,type:profile.first,region:''});
 if(releaseRows.length){const publications=['book','manga'].includes(m.kind),music=['album','track'].includes(m.kind);
  sections.push([profile.releases,`<div class="info-release-list">${releaseRows.map(r=>`<div class="info-release"><time datetime="${esc(r.date)}">${esc(r.date)}</time><span>${esc(r.region?country(r.region):music?'Market not specified':publications?'Publication region not specified':'Region not specified')}</span><span>${esc(r.type||profile.first)}${r.certification?` <b>${esc(r.certification)}</b>`:''}${r.note?`<small>${esc(r.note)}</small>`:''}</span></div>`).join('')}</div>`]);
 }
 return `<section class="media-info" id="${id}"><div class="info-tabs" role="tablist" aria-label="${esc(profile.details)}">${sections.map(([label],i)=>`<button type="button" role="tab" id="${id}-tab-${i}" aria-controls="${id}-panel-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${esc(label)}</button>`).join('')}</div>${sections.map(([label,html],i)=>`<div class="info-panel" role="tabpanel" id="${id}-panel-${i}" aria-labelledby="${id}-tab-${i}" tabindex="0" ${i?'hidden':''}>${html}</div>`).join('')}</section>${watch(m,id)}`;
}
function select(tab){const section=tab.closest('.media-info');for(const button of section.querySelectorAll('[role=tab]')){const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;section.querySelector('#'+button.getAttribute('aria-controls')).hidden=!active;}}
if(typeof document!=='undefined'){
 document.addEventListener('error',e=>{if(e.target.matches?.('.watch-service img'))e.target.hidden=true;},true);
 document.addEventListener('click',e=>{const tab=e.target.closest('.info-tabs [role=tab]');if(tab)select(tab);});
 document.addEventListener('keydown',e=>{const tab=e.target.closest('.info-tabs [role=tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...tab.closest('.info-tabs').querySelectorAll('[role=tab]')],i=tabs.indexOf(tab),next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];select(next);next.focus();});
 document.addEventListener('change',e=>{if(!e.target.matches('.watch-region'))return;const section=e.target.closest('[data-watch-id]'),m=snapshots.get(section.dataset.watchId);if(!m)return;section.querySelector('.watch-offers').innerHTML=offers(m,e.target.value);try{localStorage.setItem('folio-watch-region',e.target.value);}catch{}});
}
const api={render,offers,remember:m=>{const id='hero-media-'+(++sequence);snapshots.set(id,m);while(snapshots.size>64)snapshots.delete(snapshots.keys().next().value);return id;},forElement:element=>snapshots.get(element.closest('.media-info')?.id||element.closest('.media-hero')?.dataset.mediaKey)};if(typeof module!=='undefined')module.exports=api;else root.FolioMediaInfo=api;
})(typeof globalThis!=='undefined'?globalThis:this);
