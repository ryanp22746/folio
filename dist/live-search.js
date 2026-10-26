(function(root){
  // Only public catalog searches are cached; details and personal data stay live.
  function createCache(limit=40,ttl=120000,now=Date.now){
    const entries=new Map();
    return {
      get(key){const entry=entries.get(key);if(!entry)return undefined;if(now()-entry.time>=entry.ttl){entries.delete(key);return undefined;}entries.delete(key);entries.set(key,entry);return entry.value;},
      set(key,value,lifetime=ttl){entries.delete(key);entries.set(key,{value,time:now(),ttl:lifetime});while(entries.size>limit)entries.delete(entries.keys().next().value);}
    };
  }
  async function collect(queries,fetcher,onBatch){
    const responses=await Promise.allSettled(queries.map(async(q,index)=>{const data=await fetcher(q);onBatch(data,index);return data;}));
    if(responses.every(r=>r.status==='rejected'))throw responses[0].reason;
    return responses;
  }
  function failure(body,status){
    const detail=body?.detail,states=Array.isArray(detail?.providers)?detail.providers:detail?.provider?[detail]:[];
    const names={mal:'MyAnimeList',jikan:'Jikan',anilist:'AniList',tmdb:'TMDB',igdb:'IGDB',vndb:'VNDB',musicbrainz:'MusicBrainz',apple:'Apple Music',openlibrary:'Open Library',mangaupdates:'MangaUpdates'};
    if(states.length){
      if(states.every(s=>s.provider==='anilist'&&s.status==='disabled'))return 'Anime search through AniList is disabled in this Folio setup. Try TV show or Movie with TMDB instead.';
      return states.map(s=>`${names[s.provider]||'This provider'}: ${s.status==='disabled'?'disabled in this Folio setup':s.status==='not_configured'?'API credentials are not configured':'temporarily unavailable or rate limited'}.`).filter((v,i,a)=>a.indexOf(v)===i).join(' ');
    }
    if(status===429)return 'Search request limit reached. Wait a minute, then try again.';
    if(status===422)return 'This media type and source cannot be searched together. Choose All providers or a compatible media type.';
    if(status===401||status===403)return 'Folio could not authenticate with the metadata API. Check the server API configuration.';
    return typeof detail==='string'?detail:'The metadata service is temporarily unavailable. Try again shortly.';
  }
  const api={createCache,collect,failure};if(typeof module==='object')module.exports=api;else root.FolioLiveSearch=api;
})(typeof window==='object'?window:globalThis);
