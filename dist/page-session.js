/* Per-tab restoration: public catalog snapshots and UI positions, never credentials. */
(function(){
 const key='folio-page-session-v1',fields=['search','status','sort','genre-filter','year-filter','favorites-only','collection-filter','live-query','live-kind','live-provider','live-year','live-genre','live-platform','live-owned','live-sort'];
 function controls(){return Object.fromEntries(fields.map(id=>{const node=document.getElementById(id);return [id,node?.type==='checkbox'?node.checked:node?.value];}));}
 function setControls(values){for(const [id,value] of Object.entries(values||{})){const node=document.getElementById(id);if(!node)continue;if(['live-genre','live-platform','genre-filter'].includes(id)&&typeof FolioFacets!=='undefined'){node.value=id==='genre-filter'?'all':'';continue;}if(node.type==='checkbox')node.checked=!!value;else node.value=String(value??'');}}
 function snapshot(){const hero=liveDialog.querySelector('.media-hero');return {version:1,time:Date.now(),hash:location.hash,scroll:window.scrollY,controls:controls(),type,view,selectedCollection,collectionSpace,search:{records:liveRecords.slice(0,200),query:liveQuery,page:livePage,more:liveMore,request:liveRequest},creator:FolioCreators.snapshot(),detail:document.querySelector('#detail').open?{id:currentId,scroll:document.querySelector('#detail').scrollTop,section:document.querySelector('#detail .media-splash')?.dataset.splashSection,expanded:document.querySelector('#detail').dataset.expanded}:null,preview:liveDialog.open&&hero?{media:FolioMediaInfo.forElement(hero),scroll:liveDialog.scrollTop,section:liveDialog.dataset.splashSection,expanded:liveDialog.dataset.expanded}:null};}
 function save(){try{sessionStorage.setItem(key,JSON.stringify(snapshot()));}catch{ /* Storage may be unavailable or full; the library itself is unaffected. */ }}
 window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
 let state;try{state=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 if(!state||state.version!==1||state.hash!==location.hash||Date.now()-state.time>21600000)return;
 history.scrollRestoration='manual';
 async function restore(){
  if(typeof FolioDirectory!=='undefined')FolioDirectory.suspend(true);
  setControls(state.controls);if(types.includes(state.type))type=state.type;if(['all','catalog','home','profile','favorites',...statuses].includes(state.view))view=state.view;selectedCollection=state.selectedCollection||'all';collectionSpace=!!state.collectionSpace;
  if(state.search){liveRecords=state.search.records||[];liveQuery=state.search.query||'';livePage=state.search.page||1;liveMore=!!state.search.more;liveRequest=state.search.request||{};}
  if(typeof FolioFacets!=='undefined')FolioFacets.restoreLegacy(state.controls);
  render();facets();setControls(state.controls);drawResults();
  let dialog=null,position=0;
  if(state.creator){FolioCreators.restore(state.creator);dialog=document.querySelector('#creator-dialog');position=state.creator.scroll;}
  else if(state.detail&&items.some(x=>x.id===state.detail.id)){openOwnedDetail(state.detail.id);dialog=document.querySelector('#detail');position=state.detail.scroll;}
  else if(state.preview?.media){await showLive(state.preview.media);dialog=liveDialog;position=state.preview.scroll;}
  const detailState=state.creator?null:state.detail||state.preview;if(dialog&&detailState){const box=dialog.querySelector('.media-splash')||dialog;if(detailState.section)box.dataset.splashSection=detailState.section;FolioPresentation.bind(box);if(detailState.expanded==='true'){dialog.dataset.expanded='true';FolioDetailWindow.bind(box);}}
  let done=false;const apply=()=>{if(done)return;window.scrollTo({top:state.scroll||0,behavior:'instant'});if(dialog?.open)dialog.scrollTop=position||0;};
  const observer=new ResizeObserver(apply);observer.observe(document.querySelector('#library-page'));if(dialog)observer.observe(dialog.querySelector('#detail-content')||dialog);
  requestAnimationFrame(()=>requestAnimationFrame(apply));
  const stop=()=>{done=true;observer.disconnect();for(const event of ['wheel','pointerdown','keydown'])document.removeEventListener(event,stop,true);};
  for(const event of ['wheel','pointerdown','keydown'])document.addEventListener(event,stop,{once:true,capture:true});setTimeout(stop,2500);
 }
 restore().finally(()=>{if(typeof FolioDirectory!=='undefined')FolioDirectory.suspend(false);}).catch(()=>{ /* A stale catalog snapshot must never prevent normal navigation. */ });
})();
