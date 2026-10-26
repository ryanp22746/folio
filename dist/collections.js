/* Catalog-backed series navigation shares normal previews, library saves and history. */
(function(root){
 function sources(media){return [...new Map((media.source_records||[media]).filter(m=>m.source&&(m.source.provider==='tmdb'&&['movie','tv'].includes(m.kind)||m.source.provider==='igdb'&&m.kind==='game')).map(m=>[m.source.provider+':'+m.kind+':'+m.source.id,m])).values()];}
 function related(media){return [...new Map((media.source_records||[media]).flatMap(m=>m.related_media||[]).map(r=>[`${r.provider}:${r.kind}:${r.id}`,r])).values()];}
 if(typeof module==='object')module.exports={sources,related};if(typeof document==='undefined')return;
 const cache=new Map(),bindings=new Map();
 function sync(section,records){section.querySelectorAll('[data-part-add]').forEach(b=>{const m=records[Number(b.dataset.partAdd)],saved=owned(fromMetadata(m));b.disabled=!!saved;b.textContent=saved?'✓ In library':'+ Add';b.setAttribute('aria-label',(saved?'In library: ':'Add: ')+m.title);});}
 document.addEventListener('submit',()=>queueMicrotask(()=>{for(const [s,rows] of bindings){if(s.isConnected)sync(s,rows);else bindings.delete(s);}}));
 function bind(container){const hero=container.querySelector('.media-hero'),media=hero&&FolioMediaInfo.forElement(hero);if(!media||container.querySelector('.media-collections'))return;
  const options=sources(media),relations=related(media);if(!options.length&&!relations.length)return;
  const section=document.createElement('section');section.className='live-detail-section media-collections';section.innerHTML='<h3>Series & collections</h3><p class="collection-status" role="status">Loading related entries…</p><div class="collection-groups"></div><div class="collection-tools"><button type="button" class="collection-refresh">↻ Refresh entries</button><button type="button" class="collection-more" hidden>Load more entries</button></div>';
  const overview=container.querySelector('.media-overview');(overview||hero).after(section);
  let generation=0,controller,page=0,groups=[],records=[];
  const refs=relations.map(r=>({id:`${r.provider}:${r.kind}:${r.id}`,kind:r.kind,title:r.title,source:{provider:r.provider,id:r.id,url:'',fetched_at:''},external_ids:{},facts:{Relationship:r.relation.replaceAll('_',' ')}}));
  function paint(incomplete=false){section.querySelector('.series-progress-summary')?.remove();records=[];section.querySelector('.collection-groups').innerHTML=groups.filter(g=>g.results.length).map(g=>`<div class="collection-group"><h4>${esc(g.title)}</h4><div>${g.results.map(m=>{const i=records.push(m)-1,current=(media.source_records||[media]).some(r=>r.id===m.id);return `<div class="collection-row">${m.image_url?`<img src="${esc(safeMediaUrl(m.image_url)||'')}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'<span class="collection-no-art" aria-hidden="true">▤</span>'}<button type="button" class="collection-title" data-part-view="${i}" ${current?'disabled':''}><strong>${esc(m.title)}</strong><small>${esc([current?'Currently viewing':m.format,m.facts?.Relationship,m.release_date,m.facts?.Episodes?m.facts.Episodes+' episodes':''].filter(Boolean).join(' · '))}</small></button><button type="button" data-part-add="${i}">+ Add</button></div>`;}).join('')}</div></div>`).join('');bindings.set(section,records);sync(section,records);
   section.querySelectorAll('[data-part-view]').forEach(b=>b.onclick=()=>{root.FolioDirectory?.before();container.closest('dialog')?.close();showLive(records[Number(b.dataset.partView)]);});
   section.querySelectorAll('[data-part-add]').forEach(b=>b.onclick=()=>importLive(records[Number(b.dataset.partAdd)],b));
   root.FolioSeriesProgress?.bind(section,media,records);
   root.FolioCollectionProgress?.bind(section,media,records,incomplete);
  }
  async function load(append=false,force=false){const current=++generation;controller?.abort();controller=new AbortController();const next=append?page+1:1;section.setAttribute('aria-busy','true');section.querySelector('.collection-status').textContent='Loading related entries…';section.querySelector('.collection-more').disabled=true;
   const responses=await Promise.allSettled(options.map(async m=>{const path=`collections/${m.source.provider}/${m.kind}/${m.source.id}?page=${next}`;if(!force&&cache.has(path))return cache.get(path);const data=await metadataGet(path,controller.signal,force);cache.set(path,data);while(cache.size>32)cache.delete(cache.keys().next().value);return data;}));
   if(current!==generation||!section.isConnected)return;
   if(!append)groups=refs.length?[{title:'Related seasons & works',results:refs}]:[];
   let more=false,failed=false;
   for(const response of responses){if(response.status==='rejected'){failed=true;continue;}const data=response.value;more||=data.more;const additions=[...(data.parent?[{title:data.parent.format==='Season'?'Parent season':data.parent.kind==='tv'?'Full series':'Part of',results:[data.parent]}]:[]),...data.groups];for(const g of additions){const old=groups.find(x=>x.title===g.title);if(old)old.results=[...new Map([...old.results,...g.results].map(m=>[m.id,m])).values()];else groups.push(g);}}
   page=next;paint(more||failed);section.querySelector('.collection-status').textContent=failed?'Some entries could not load. You can retry below.':records.length?(section.querySelector('.collection-progress-summary')?'Check individual titles to update collection progress.':section.querySelector('.series-progress-summary')?'Track episodes on the full series below, or open individual entries.':'Open or add individual entries. Progress and ratings are saved separately for the whole title and each part.'):'No seasons or collection entries supplied for this title.';
   section.querySelector('.collection-more').hidden=!more;section.querySelector('.collection-more').disabled=false;section.setAttribute('aria-busy','false');
  }
  section.querySelector('.collection-refresh').onclick=()=>load(false,true);section.querySelector('.collection-more').onclick=()=>load(true);load();
 }
 root.FolioCollections={bind};
})(globalThis);
