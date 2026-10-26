(function(root){
 const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const plans=entry=>({Movie:[['tmdb','movie']], 'TV show':[['tmdb','tv']], Anime:[['tmdb','tv'],['tmdb','movie']], Game:[['igdb','game']], 'Visual novel':[['vndb','visual_novel']], Manga:[['mangaupdates','manga']], Music:[['spotify','album'],['apple','album'],['musicbrainz','album']], Book:[['openlibrary','book']]}[entry.type]||[]);
 function matches(entry,m){
  if(!plans(entry).some(([provider,kind])=>m.source.provider===provider&&m.kind===kind))return false;
  if(![m.title,m.original_title,...(m.alternative_titles||[])].some(t=>t&&normalize(t)===normalize(entry.title)))return false;
  if(entry.year&&String(entry.year)!==m.release_date?.slice(0,4))return false;
  if(['Music','Book'].includes(entry.type))return !!entry.creator&&(m.creators||[]).some(c=>normalize(c)===normalize(entry.creator));
  if(['Movie','TV show'].includes(entry.type)&&entry.creator&&m.creators?.length)return m.creators.some(c=>normalize(c)===normalize(entry.creator));
  return true;
 }
 function select(entry,rows){const exact=[...new Map(rows.filter(m=>matches(entry,m)).map(m=>[m.id,m])).values()];return exact.length===1?exact[0]:null;}
 function patch(entry,m,converted){
  const next={...entry,metadata:m,sources:converted.sources,metadata_refreshed_at:Date.now(),year:converted.year||entry.year,creator:converted.creator||entry.creator,genre:converted.genre||entry.genre};
  if(!entry.coverUrl&&!entry.coverImage)next.coverUrl=converted.coverUrl;
  if(/^(demo-|catalog-|book-)/.test(entry.id)||!entry.description)next.description=converted.description;
  return next;
 }
 function integrity(backup,current,collections){
  const fields=['title','type','status','rating','favorite','notes','added','sessions','journal','episodeProgress','progressUnit','tags','mediaUrl','mediaLinkLabel','coverImage','backgroundImage','backgroundUrl'];
  const original=backup.items||[];let changed=0,missing=0;
  for(const old of original){const next=current.find(x=>x.id===old.id);if(!next){missing++;continue;}if(fields.some(k=>JSON.stringify(old[k])!==JSON.stringify(next[k]))||(old.coverUrl&&old.coverUrl!==next.coverUrl))changed++;}
  return {original:original.length,retained:original.length-missing,changed,collectionsUnchanged:JSON.stringify(backup.collections||[])===JSON.stringify(collections)};
 }
 const api={normalize,plans,matches,select,patch,integrity};
 if(typeof module!=='undefined'){module.exports=api;return;}root.FolioLibraryUpgrade=api;
 const section=document.createElement('section');section.className='preferences-section library-upgrade';
 section.innerHTML='<h3>Replace sample metadata</h3><p class="muted">Find the real provider versions of existing titles, keeping personal ratings, favorites, progress, notes and collections. Only unambiguous title/year matches are connected; music and books must also match the creator.</p><button class="secondary" id="upgrade-library">Connect existing library titles</button><p id="upgrade-library-status" role="status"></p><ul id="upgrade-library-report"></ul><button class="secondary" id="export-upgrade-backup" hidden>Export original library backup</button>';
 const audit=document.createElement('p');audit.className='muted';audit.id='upgrade-library-integrity';audit.setAttribute('role','status');section.append(audit);
 document.getElementById('settings-dialog').append(section);
 const button=section.querySelector('#upgrade-library'),status=section.querySelector('#upgrade-library-status'),report=section.querySelector('#upgrade-library-report'),backupButton=section.querySelector('#export-upgrade-backup');
 const backupKey='folio-library-before-provider-upgrade-v1';
 function verify(){try{const backup=JSON.parse(localStorage.getItem(backupKey));if(!backup)return;const result=integrity(backup,JSON.parse(localStorage.getItem('folio-library-v1')),JSON.parse(localStorage.getItem('folio-collections-v1')||'[]'));audit.textContent=`Backup check: ${result.retained}/${result.original} original entries retained, ${result.changed} personal-field changes; collections ${result.collectionsUnchanged?'unchanged':'changed since backup'}.`;}catch{audit.textContent='Backup is available for export.';}}
 backupButton.hidden=!localStorage.getItem(backupKey);verify();
 backupButton.onclick=()=>{const saved=localStorage.getItem(backupKey);if(!saved)return;const url=URL.createObjectURL(new Blob([saved],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='folio-original-library-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 button.onclick=async()=>{
  button.disabled=true;report.replaceChildren();let count=0,skipped=0;
  try{
   const snapshot=JSON.parse(localStorage.getItem('folio-library-v1')||JSON.stringify(items));
   const targets=snapshot.filter(x=>!x.metadata);
   if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify({saved_at:new Date().toISOString(),items:snapshot,collections:JSON.parse(localStorage.getItem('folio-collections-v1')||'[]')}));backupButton.hidden=false;
   for(const [index,entry] of targets.entries()){
    status.textContent=`Checking ${index+1} of ${targets.length}: ${entry.title}…`;
    let selected=null,detail=null,reason='No unambiguous title/year match found';
    for(const [provider,kind] of plans(entry)){
     try{
      const q=entry.type==='Music'?entry.title+' '+entry.creator:entry.title;
      const data=await metadataGet('search?'+new URLSearchParams({q,provider,kind}));
      const candidates=data.results.filter(m=>matches(entry,m));if(!candidates.length||candidates.length>3)continue;
      const confirmed=[];
      for(const candidate of candidates){const fresh=await getDetail(candidate);if(matches(entry,fresh))confirmed.push([candidate,fresh]);}
      if(confirmed.length!==1){reason='Provider details did not confirm one unique match';continue;}
      [selected,detail]=confirmed[0];break;
     }catch{reason='Provider unavailable; retry later';}
    }
    let outcome;
    if(detail){
     const latest=JSON.parse(localStorage.getItem('folio-library-v1')||JSON.stringify(items));const target=latest.find(x=>x.id===entry.id);
     if(!target||target.metadata||!matches(target,selected)){outcome='Kept recent library changes';skipped++;}
     else if(latest.some(x=>x.id!==target.id&&x.metadata&&FolioIdentity.same(x.metadata,detail))){outcome='A live version already exists; kept both personal entries for review';skipped++;}
     else{Object.assign(target,patch(target,detail,fromMetadata(detail)));localStorage.setItem('folio-library-v1',JSON.stringify(latest));items=latest;count++;outcome='Connected to '+sourceNames(detail);}
    }else{skipped++;outcome=reason;}
    const row=document.createElement('li');row.textContent=entry.title+' — '+outcome;report.append(row);
   }
   status.textContent=`Finished: ${count} connected, ${skipped} left unchanged. Personal data and collection memberships preserved.`;verify();render();drawResults();
  }catch{status.textContent='Could not complete the update. Saved titles are intact; check browser storage and retry.';}
  finally{button.disabled=false;}
 };
})(globalThis);
