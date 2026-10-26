/* Shared detail folds and original-resolution artwork viewer. */
(function(root){
 function original(value){try{const u=new URL(value);if(u.hostname==='images.igdb.com')u.pathname=u.pathname.replace(/\/t_[^/]+\//,'/t_original/');if(u.hostname==='image.tmdb.org')u.pathname=u.pathname.replace(/\/t\/p\/[^/]+\//,'/t/p/original/');return u.href;}catch{return value;}}
 function view(img){
  const hero=img.closest('.media-hero'),portrait=img.classList.contains('media-poster');
  const select=hero.querySelector(`[data-artwork-type="${portrait?'portrait':'background'}"]`);
  const urls=[...new Set([...(select?Array.from(select.options).map(o=>o.value):[]),img.currentSrc].filter(v=>/^(https:\/\/|data:image\/)/.test(v)))];
  let index=Math.max(0,urls.indexOf(img.currentSrc));
  const dialog=document.createElement('dialog');dialog.className='artwork-lightbox';dialog.setAttribute('aria-label',portrait?'Portrait gallery':'Background gallery');
  const picture=document.createElement('img');picture.alt=portrait?'Full size portrait':'Full size background';picture.referrerPolicy='no-referrer';
  const controls=document.createElement('div');controls.className='artwork-viewer-controls';
  const previous=document.createElement('button'),next=document.createElement('button'),close=document.createElement('button'),count=document.createElement('span');
  previous.textContent='‹';previous.setAttribute('aria-label','Previous artwork');next.textContent='›';next.setAttribute('aria-label','Next artwork');close.textContent='Close';close.setAttribute('aria-label','Close full size artwork');count.setAttribute('aria-live','polite');
  const paint=()=>{picture.onerror=()=>{picture.onerror=null;picture.src=urls[index];};picture.src=original(urls[index]);count.textContent=`${index+1} / ${urls.length}`;previous.hidden=next.hidden=urls.length<2;};
  const move=step=>{index=(index+step+urls.length)%urls.length;paint();};previous.onclick=()=>move(-1);next.onclick=()=>move(1);close.onclick=()=>dialog.close();
  controls.append(previous,count,next,close);dialog.append(picture,controls);document.body.append(dialog);paint();
  dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}};
  dialog.onclose=()=>{dialog.remove();img.focus();};dialog.showModal();close.focus();
 }
 const storage='folio-detail-folds-v1';
 function preferences(){try{return JSON.parse(localStorage.getItem(storage)||'{}')||{};}catch{return {};}}
 function bind(container){
  const prefs=preferences();
  for(const section of container.querySelectorAll('.media-overview,.live-detail-section,.media-info,.media-watch,.activity-section,.journal-section')){
   if(section.closest('.detail-fold'))continue;
   const heading=section.querySelector('h3');const label=heading?.textContent.trim()||(section.classList.contains('media-info')?'Credits & details':'More information');
   const fold=document.createElement('details');fold.className='detail-fold';fold.dataset.sectionLabel=label;fold.open=prefs[label]!==false;
   const summary=document.createElement('summary');summary.textContent=label;section.before(fold);fold.append(summary,section);
   fold.addEventListener('toggle',()=>{const current=preferences();current[label]=fold.open;try{localStorage.setItem(storage,JSON.stringify(current));}catch{}});
  }
  if(!container.querySelector('.detail-fold')||container.querySelector('.detail-section-tools'))return;
  const tools=document.createElement('nav');tools.className='detail-section-tools';tools.setAttribute('aria-label','Detail sections');
  for(const [label,open] of [['Expand sections',true],['Collapse sections',false]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>container.querySelectorAll('.detail-fold').forEach(f=>f.open=open);tools.append(button);}
  const hero=container.querySelector('.media-hero');if(hero)hero.after(tools);else container.prepend(tools);
 }
 const api={original,view,bind};if(typeof module==='object')module.exports=api;else root.FolioDetailPresentation=api;
})(globalThis);
