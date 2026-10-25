(function(root){
  function metadata(x){return x.metadata||x;}
  function keys(x){const m=metadata(x);return Object.entries(m.external_ids||{}).filter(([,v])=>typeof v==='string'&&v).map(([ns,v])=>JSON.stringify([m.kind,ns,v]));}
  function conflicts(a,b){a=metadata(a);b=metadata(b);return a.kind!==b.kind||Object.entries(a.external_ids||{}).some(([ns,v])=>b.external_ids?.[ns]&&b.external_ids[ns]!==v);}
  function same(a,b){if(a.id===b.id)return true;if(conflicts(a,b))return false;const right=new Set(keys(b));return keys(a).some(k=>right.has(k));}
  function possible(a,b){return a.type===b.type&&String(a.title).normalize('NFKC').trim().toLowerCase()===String(b.title).normalize('NFKC').trim().toLowerCase();}
  function records(m){return m.source_records||[m];}
  function combine(input){const rows=[...new Map(input.flatMap(records).map(m=>{const {source_records,version_options,...base}=m;return [m.id,base];})).values()];if(!rows.length)return null;const anchor=rows.find(m=>m.source.provider==='musicbrainz')||rows[0];if(rows.some(a=>rows.some(b=>conflicts(a,b)))||rows.some(m=>!same(anchor,m)))return null;const primary={...anchor};for(const m of rows){for(const [k,v] of Object.entries(m))if(primary[k]==null||primary[k]==='')primary[k]=v;}
    primary.external_ids=Object.assign({},...rows.map(m=>m.external_ids));primary.facts=Object.assign({},...rows.map(m=>m.facts));primary.genres=[...new Set(rows.flatMap(m=>m.genres||[]))];primary.platforms=[...new Set(rows.flatMap(m=>m.platforms||[]))];primary.ratings=[...new Map(rows.flatMap(m=>m.ratings||[]).map(r=>[r.source.provider+':'+r.label,r])).values()];primary.enrichments=[...new Map(rows.flatMap(m=>m.enrichments||[]).map(e=>[e.source.provider+':'+e.source.id,e])).values()];primary.enrichment_status=rows.flatMap(m=>m.enrichment_status||[]);primary.search_priority=Math.max(...rows.map(m=>m.search_priority||0));if(rows.length>1)primary.source_records=rows;return primary;}
  function group(input){const buckets=[];for(const m of [...new Map(input.flatMap(records).map(m=>[m.id,m])).values()]){const bucket=buckets.find(b=>same(b[0],m)&&b.every(x=>!conflicts(x,m)));if(bucket)bucket.push(m);else buckets.push([m]);}return buckets.map(b=>combine(b)||b[0]);}
  function editions(input){const norm=s=>String(s||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');const key=m=>m.kind==='album'&&/^\d{4}-\d{2}-\d{2}$/.test(m.release_date||'')&&(m.creators||[]).length?JSON.stringify([norm(m.title),m.creators.map(norm).sort(),m.release_date]):null;const out=[];for(const m of input){const k=key(m),prior=k&&out.find(x=>key(x)===k&&x.source.provider!==m.source.provider);if(prior){if(m.source.provider==='musicbrainz'&&prior.source.provider!=='musicbrainz'){const {version_options,...base}=prior;out[out.indexOf(prior)]={...m,version_options:[base,...(version_options||[])]};}else prior.version_options=[...(prior.version_options||[]),m];}else out.push({...m});}return out;}
  function refresh(previous,fresh){
    if(!same(previous,fresh)||conflicts(previous,fresh))throw Error('Provider identity changed; saved details were kept.');
    const failed=new Set((fresh.enrichment_status||[]).filter(s=>['unavailable','not_configured','disabled'].includes(s.status)).map(s=>s.provider));
    const enrichments=[...(fresh.enrichments||[])];
    for(const e of previous.enrichments||[])if(failed.has(e.source.provider)&&!enrichments.some(x=>x.source.provider===e.source.provider))enrichments.push(e);
    return {...previous,...fresh,external_ids:{...previous.external_ids,...fresh.external_ids},enrichments};
  }
  const api={same,possible,group,combine,records,editions,refresh};if(typeof module!=='undefined')module.exports=api;else root.FolioIdentity=api;
})(globalThis);
