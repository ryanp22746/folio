/* Reconcile existing cards so personal edits retain images, focus and motion state. */
(function(root){
 function reconcile(previous,fresh){const existing=new Map(previous.map(e=>[e.id,e]));return fresh.map(value=>{const old=existing.get(value.id);if(!old)return value;for(const key of Object.keys(old))if(!(key in value))delete old[key];Object.assign(old,value);return old;});}
 if(typeof module==='object')module.exports={reconcile};
 if(typeof document==='undefined')return;
 function morph(old,fresh){
  if(old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName){old.replaceWith(fresh);return;}
  if(old.nodeType===3){if(old.data!==fresh.data)old.data=fresh.data;return;}
  if(old.nodeType!==1)return;
  for(const a of [...old.attributes])if(!fresh.hasAttribute(a.name)&&a.name!=='data-reconciled')old.removeAttribute(a.name);
  for(const a of fresh.attributes)if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
  for(const event of ['onclick','onchange','oninput'])old[event]=fresh[event];
  const before=[...old.childNodes],after=[...fresh.childNodes];
  for(let i=0;i<Math.max(before.length,after.length);i++){if(!after[i])before[i].remove();else if(!before[i])old.append(after[i]);else morph(before[i],after[i]);}
 }
 const previous=render;render=function(){
  const grid=document.querySelector('#grid'),cards=new Map([...grid.querySelectorAll('[data-library-id]')].map(n=>[n.dataset.libraryId,n]));
  previous();
  for(const fresh of grid.querySelectorAll('[data-library-id]')){const old=cards.get(fresh.dataset.libraryId);if(old){morph(old,fresh);old.dataset.reconciled='true';fresh.replaceWith(old);}}
 };
 root.FolioLibraryPatch={update:()=>render(),entries:fresh=>reconcile(items,fresh)};
})(globalThis);
