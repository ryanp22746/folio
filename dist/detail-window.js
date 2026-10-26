// Each media preview opens as a popout. Expansion lasts only until that window closes.
(function(root){
 const observed=new WeakSet();
 function paint(dialog,button){
  const expanded=dialog.dataset.expanded==='true';
  const label=expanded?'Restore details to popout':'Expand details to full window';
  button.setAttribute('aria-label',label);button.title=label;
  button.setAttribute('aria-pressed',String(expanded));
  button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${expanded?'<path d="M9 3v6H3m18 6h-6v6M9 9 3 3m12 12 6 6"/>':'<path d="M8 3H3v5m13 13h5v-5M3 3l7 7m11 11-7-7"/>'}</svg>`;
 }
 function bind(container){
  const dialog=container.closest('dialog');if(!dialog||!dialog.querySelector('.media-hero'))return;
  let controls=dialog.querySelector('.detail-window-controls');
  if(!controls){
   const close=dialog.querySelector('.close');if(!close)return;
   controls=document.createElement('div');controls.className='detail-window-controls';
   const button=document.createElement('button');button.type='button';button.className='detail-expand';
   close.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>';
   controls.append(button,close);dialog.prepend(controls);
   button.onclick=()=>{const scroll=dialog.scrollTop;dialog.dataset.expanded=String(dialog.dataset.expanded!=='true');paint(dialog,button);dialog.scrollTop=scroll;};
  }
  paint(dialog,controls.querySelector('.detail-expand'));
  if(!observed.has(dialog)){
   dialog.addEventListener('close',()=>{delete dialog.dataset.expanded;const button=dialog.querySelector('.detail-expand');if(button)paint(dialog,button);});
   observed.add(dialog);
  }
 }
 root.FolioDetailWindow={bind};
})(globalThis);
