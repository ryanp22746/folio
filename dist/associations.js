/* Character relations enrich results asynchronously; title discovery never waits for them. */
(function(root){
 const norm=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 function eligible(q,kind,provider){return q.length>=3&&q.length<=80&&q.split(/\s+/).length<=4&&!/["“”]/.test(q)&&(!kind||kind==='anime')&&(!provider||['mal','jikan'].includes(provider))&&!/^(studio|developer|artist|author|director|publisher)\s/i.test(q);}
 const api={eligible};if(typeof module==='object')module.exports=api;if(typeof document==='undefined')return;
 let key='',records=[],controller,generation=0,timer,force=false;
 const status=document.createElement('p');status.className='association-status';status.setAttribute('role','status');status.hidden=true;document.querySelector('#live-results').before(status);
 api.related=()=>key===liveQuery?records:[];root.FolioAssociations=api;
 document.querySelector('.search-refresh').addEventListener('click',()=>{key='';records=[];generation++;controller?.abort();force=true;});
 document.querySelector('#live-query').addEventListener('input',()=>{generation++;controller?.abort();clearTimeout(timer);records=[];key='';status.hidden=true;});
 document.addEventListener('folio:search-results',event=>{
  if(!event.detail.finished)return;
  const q=liveQuery,kind=document.querySelector('#live-kind').value||FolioSearch.intent(q).kind,provider=document.querySelector('#live-provider').value;
  if(!eligible(q,kind,provider)){records=[];key='';status.hidden=true;return;}
  if(key===q)return;key=q;records=[];const current=++generation;controller?.abort();controller=new AbortController();status.hidden=false;status.textContent='Checking character connections…';
  timer=setTimeout(async()=>{try{const data=await metadataGet('characters/find?q='+encodeURIComponent(FolioSearch.intent(q).query),controller.signal,force);if(current!==generation||q!==liveQuery)return;force=false;records=data.matches.flatMap(match=>match.results.map(m=>({...m,discovery_context:{query:q,name:match.name,url:match.url,type:'character'}})));status.hidden=!records.length;status.textContent=records.length?'Also showing titles featuring '+data.matches.map(m=>m.name).join(', ')+'.':'';drawResults();document.dispatchEvent(new CustomEvent('folio:associations',{detail:{results:records}}));}catch(e){if(current===generation&&e.name!=='AbortError'){status.textContent='Character connections are unavailable; title and creator results are still shown.';}}},300);
 });
})(globalThis);
