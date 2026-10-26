(function(root){
 function toggle(entry){const done=entry.status==='Completed';const next={...entry};if(done){next.status=['Want to experience','In progress','On hold'].includes(entry.completionPreviousStatus)?entry.completionPreviousStatus:'Want to experience';delete next.completionPreviousStatus;}else{next.completionPreviousStatus=entry.status;next.status='Completed';}return next;}
 if(typeof module==='object')module.exports={toggle};
 if(typeof document==='undefined')return;
 function paint(){const count=items.filter(x=>x.status==='Completed').length;document.querySelector('#completed-count').textContent=count;const focus=document.querySelector('#show-completed');focus.setAttribute('aria-label',`Show completed titles, ${count} in your library`);focus.setAttribute('aria-pressed',String(document.querySelector('#status').value==='Completed'));}
 const previous=render;render=function(){previous();paint();};paint();
 document.addEventListener('change',e=>{const control=e.target.closest('[data-status-id]');if(!control||!statuses.includes(control.value))return;const previousItems=items.map(x=>({...x}));try{const fresh=JSON.parse(localStorage.getItem('folio-library-v1')||'null');if(Array.isArray(fresh))items=root.FolioLibraryPatch?root.FolioLibraryPatch.entries(fresh):fresh;}catch{}const entry=items.find(x=>x.id===control.dataset.statusId);if(!entry)return;const old=entry.status;entry.status=control.value;delete entry.completionPreviousStatus;if(!persist()){items=root.FolioLibraryPatch?root.FolioLibraryPatch.entries(previousItems):previousItems;control.value=old;return;}render();for(const select of document.querySelectorAll('[data-status-id]'))if(select.dataset.statusId===entry.id)select.value=entry.status;for(const b of document.querySelectorAll('[data-complete]'))if(b.dataset.complete===entry.id)b.outerHTML=completionControl(entry);toast('Status: '+(entry.status==='Want to experience'?'Up next':entry.status));});
 document.querySelector('#show-completed').onclick=()=>{collectionSpace=false;view='all';document.querySelector('#status').value=document.querySelector('#status').value==='Completed'?'all':'Completed';render();};
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-complete]');if(!button)return;
  const id=button.dataset.complete,previousItems=items.map(e=>({...e}));
  try{const fresh=JSON.parse(localStorage.getItem('folio-library-v1')||'null');if(Array.isArray(fresh)&&fresh.some(x=>x.id===id))items=root.FolioLibraryPatch?root.FolioLibraryPatch.entries(fresh):fresh;}catch{}
  const index=items.findIndex(x=>x.id===id);if(index<0)return;
  const entry=items[index],next=toggle(entry);for(const key of Object.keys(entry))if(!(key in next))delete entry[key];Object.assign(entry,next);
  if(!persist()){items=root.FolioLibraryPatch?root.FolioLibraryPatch.entries(previousItems):previousItems;return;}
  const dialog=button.closest('dialog');render();
  if(dialog){button.outerHTML=completionControl(entry);}
  const scope=dialog||document.querySelector('#grid');const nextFocus=[...scope.querySelectorAll('[data-complete]')].find(b=>b.dataset.complete===id);(nextFocus||document.querySelector('#status')).focus();
  toast(entry.status==='Completed'?`Completed: ${entry.title}. Use Completed again to undo.`:`Completion undone: ${entry.title}.`);
 });
 root.FolioCompletion={toggle};
})(globalThis);
