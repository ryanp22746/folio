(function(root){
  function metadata(x){return x.metadata||x;}
  const family=kind=>['game','visual_novel'].includes(kind)?'interactive':['tv','anime'].includes(kind)?'series':kind;
  const mediaFamily=m=>m.kind==='anime'&&String(m.format).toLowerCase()==='movie'?'movie':family(m.kind);
  const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/&/g,'and').replace(/[^\p{L}\p{N}]+/gu,'');
  function keys(x){const m=metadata(x);return Object.entries(m.external_ids||{}).filter(([,v])=>typeof v==='string'&&v).map(([ns,v])=>JSON.stringify([mediaFamily(m),ns,v]));}
  function conflicts(a,b){a=metadata(a);b=metadata(b);return mediaFamily(a)!==mediaFamily(b)||Object.entries(a.external_ids||{}).some(([ns,v])=>b.external_ids?.[ns]&&b.external_ids[ns]!==v);}
  function same(a,b){if(a.id===b.id)return true;if(conflicts(a,b))return false;const right=new Set(keys(b));if(keys(a).some(k=>right.has(k)))return true;
    a=metadata(a);b=metadata(b);if(!a.source||!b.source||a.source.provider===b.source.provider)return false;
    if(['album','track'].includes(a.kind)){
      // Different clean/explicit editions and recordings are selectable versions, not interchangeable IDs.
      const edition=m=>{const value=String(m.facts?.Edition||m.facts?.['Explicit content']||'').toLowerCase();return ['clean','not explicit','notexplicit','no'].includes(value)?'no':['explicit','yes'].includes(value)?'yes':value;};
      if(edition(a)&&edition(b)&&edition(a)!==edition(b))return false;
      if(a.kind==='album'&&a.facts?.Tracks&&b.facts?.Tracks&&a.facts.Tracks!==b.facts.Tracks)return false;
      const seconds=m=>{const d=m.facts?.Duration;return /^\d+:\d{2}$/.test(d||'')?d.split(':').reduce((n,x)=>n*60+Number(x),0):null;};
      if(a.kind==='track'&&seconds(a)!=null&&seconds(b)!=null&&Math.abs(seconds(a)-seconds(b))>3)return false;
    }
    // A title alone cannot distinguish adaptations, remakes or editions. Require
    // matching release years, compatible media, and creator evidence as well.
    const year=String(a.release_date||'').slice(0,4);if(!/^\d{4}$/.test(year)||year!==String(b.release_date||'').slice(0,4))return false;
    const titles=m=>[m.title,m.original_title,...(m.alternative_titles||[])].map(normalize).filter(Boolean);
    if(!titles(a).some(t=>titles(b).includes(t)))return false;
    if(new Set([a.source.provider,b.source.provider]).size===2&&[a.source.provider,b.source.provider].every(p=>['igdb','vndb'].includes(p)))return true;
    const animated=m=>(m.genres||[]).some(g=>normalize(g)==='animation');
    if((a.kind==='anime'&&b.source.provider==='tmdb'&&animated(b)&&isAnime(b))||(b.kind==='anime'&&a.source.provider==='tmdb'&&animated(a)&&isAnime(a)))return true;
    const creators=m=>[...(m.creators||[]),...(m.credits||[]).filter(c=>/developer|studio|author|artist|director/i.test(c.role||'')).map(c=>c.name)].map(normalize).filter(Boolean);
    return creators(a).some(name=>creators(b).includes(name));
  }
  function possible(a,b){return a.type===b.type&&String(a.title).normalize('NFKC').trim().toLowerCase()===String(b.title).normalize('NFKC').trim().toLowerCase();}
  function records(m){return m.source_records||[m];}
  function combine(input){const rows=[...new Map(input.flatMap(records).map(m=>{const {source_records,version_options,...base}=m;return [m.id,base];})).values()];if(!rows.length)return null;const anchor=rows.find(m=>m.source.provider==='vndb')||rows.find(m=>m.source.provider==='musicbrainz')||rows.find(m=>m.kind==='anime')||rows[0];if(rows.some(a=>rows.some(b=>conflicts(a,b)))||rows.some(m=>!same(anchor,m)))return null;const primary={...anchor};for(const m of rows){for(const [k,v] of Object.entries(m))if(primary[k]==null||primary[k]==='')primary[k]=v;}
    primary.portrait_urls=[...new Set(rows.flatMap(m=>[m.image_url,...(m.portrait_urls||[])]).filter(Boolean))];primary.backdrop_urls=[...new Set(rows.flatMap(m=>[m.backdrop_url,...(m.backdrop_urls||[])]).filter(Boolean))];primary.credits=[...new Map(rows.flatMap(m=>m.credits||[]).map(c=>[JSON.stringify([c.url,c.name,c.role,c.character,c.note]),c])).values()];primary.media_links=[...new Map(rows.flatMap(m=>m.media_links||[]).map(l=>[l.url,l])).values()];primary.external_ids=Object.assign({},...rows.map(m=>m.external_ids));primary.facts=Object.assign({},...rows.map(m=>m.facts));primary.genres=[...new Set(rows.flatMap(m=>m.genres||[]))];primary.content_tags=[...new Set(rows.flatMap(m=>m.content_tags||[]))];primary.platforms=[...new Set(rows.flatMap(m=>m.platforms||[]))];primary.ratings=[...new Map(rows.flatMap(m=>m.ratings||[]).map(r=>[r.source.provider+':'+r.label,r])).values()];primary.enrichments=[...new Map(rows.flatMap(m=>m.enrichments||[]).map(e=>[e.source.provider+':'+e.source.id,e])).values()];primary.enrichment_status=rows.flatMap(m=>m.enrichment_status||[]);primary.search_priority=Math.max(...rows.map(m=>m.search_priority||0));if(rows.length>1)primary.source_records=rows;return primary;}
  function group(input){const buckets=[];for(const m of [...new Map(input.flatMap(records).map(m=>[m.id,m])).values()]){const bucket=buckets.find(b=>combine([...b,m]));if(bucket)bucket.push(m);else buckets.push([m]);}return buckets.map(b=>combine(b));}
  // Rich detail can expose edition differences absent in search summaries.
  // Keep every source available as a version instead of failing the entire preview.
  function detailVersions(previous,fresh){const merged=combine(fresh);if(merged)return {...merged,...(previous.version_options?{version_options:previous.version_options}:{})};const groups=group(fresh),primary=groups.find(m=>records(m).some(r=>r.id===previous.id))||groups[0];if(!primary)return null;const alternatives=[...groups.filter(m=>m!==primary),...(previous.version_options||[])];const active=new Set(records(primary).map(r=>r.id));return {...primary,version_options:[...new Map(alternatives.filter(m=>!active.has(m.id)).map(m=>[m.id,m])).values()]};}
  function editions(input){const norm=s=>String(s||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');const key=m=>['album','track'].includes(m.kind)&&(m.creators||[]).length?JSON.stringify([m.kind,norm(m.title),m.creators.map(norm).sort()]):m.kind==='track'&&/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(String(m.external_ids?.isrc||'').toUpperCase().replaceAll('-',''))?JSON.stringify(['track',m.external_ids.isrc.toUpperCase().replaceAll('-','')]):null;const out=[];for(const m of input){const k=key(m),prior=k&&out.find(x=>key(x)===k);if(prior){if(m.source.provider==='musicbrainz'&&prior.source.provider!=='musicbrainz'){const {version_options,...base}=prior;out[out.indexOf(prior)]={...m,version_options:[base,...(version_options||[])]};}else prior.version_options=[...(prior.version_options||[]),m];}else out.push({...m});}return out;}
  function refresh(previous,fresh){
    if(!same(previous,fresh)||conflicts(previous,fresh))throw Error('Provider identity changed; saved details were kept.');
    const failed=new Set((fresh.enrichment_status||[]).filter(s=>['unavailable','not_configured','disabled'].includes(s.status)).map(s=>s.provider));
    const enrichments=[...(fresh.enrichments||[])];
    for(const e of previous.enrichments||[])if(failed.has(e.source.provider)&&!enrichments.some(x=>x.source.provider===e.source.provider))enrichments.push(e);
    return {...previous,...fresh,media_links:fresh.media_links?.length?fresh.media_links:previous.media_links||[],search_priority:fresh.search_priority??previous.search_priority,release_date:fresh.release_date??previous.release_date,image_url:fresh.image_url??previous.image_url,creators:fresh.creators?.length?fresh.creators:previous.creators,external_ids:{...previous.external_ids,...fresh.external_ids},enrichments};
  }
  // Animation is a medium, not evidence of Japanese origin.
  function isAnime(m){return m.kind==='anime'||!!m.external_ids?.myanimelist||!!m.external_ids?.anilist||(['movie','tv'].includes(m.kind)&&(m.genres||[]).some(g=>normalize(g)==='animation')&&(m.original_language==='ja'||(m.origin_countries||[]).includes('JP')));}
  function matchesKind(m,kind){return !kind||records(m).some(r=>r.kind===kind||(kind==='anime'&&isAnime(r)));}
  const api={matchesKind,same,possible,group,combine,records,editions,refresh,detailVersions};if(typeof module!=='undefined')module.exports=api;else root.FolioIdentity=api;
})(globalThis);
