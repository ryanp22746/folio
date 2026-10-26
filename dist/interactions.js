// Shared feedback is delegated so it survives card and dialog re-renders.
(function(){
  function coordinates(x,y,zoom,box){return box?{x:(x-box.left)/box.scale+box.scrollLeft-box.clientLeft,y:(y-box.top)/box.scale+box.scrollTop-box.clientTop}:{x:x/zoom,y:y/zoom};}
  if(typeof module==='object')module.exports={coordinates};
  if(typeof document==='undefined')return;
  globalThis.FolioFeedback={coordinates};
  const reduce=()=>document.documentElement.dataset.motion==='reduced'||(document.documentElement.dataset.motion!=='full'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function feedback(trigger,adding,x,y){
    if(reduce())return;
    const rect=trigger.getBoundingClientRect();
    const effect=document.createElement('div');effect.className='favorite-feedback'+(adding?'':' is-removing');effect.setAttribute('aria-hidden','true');
    const host=trigger.closest('dialog'),zoom=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;
    const px=x||rect.left+rect.width/2,py=y||rect.top+rect.height/2;
    const box=host?.getBoundingClientRect(),point=coordinates(px,py,zoom,host?{left:box.left,top:box.top,scale:box.width/host.offsetWidth||zoom,scrollLeft:host.scrollLeft,scrollTop:host.scrollTop,clientLeft:host.clientLeft,clientTop:host.clientTop}:null);
    if(host)effect.style.position='absolute';effect.style.left=point.x+'px';effect.style.top=point.y+'px';
    const classic=document.documentElement.dataset.theme==='yotsuba';
    effect.classList.toggle('favorite-feedback--classic',classic);
    effect.innerHTML=classic?`<span>${adding?'[ ♥ Saved ]':'[ Unfavorited ]'}</span>`:'<span>♥</span>'+Array.from({length:6},(_,i)=>`<i style="--angle:${i*60}deg"></i>`).join('');
    (host||document.body).append(effect);
    setTimeout(()=>effect.remove(),750);
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest('.favorite-control,.favorite-toggle,#favorite,[data-menu-action="favorite"]');if(!button)return;
    const before=button.hasAttribute('aria-pressed')?button.getAttribute('aria-pressed')==='true':/favorited|unfavorite|remove favorite/i.test(button.textContent);
    feedback(button,!before,e.clientX,e.clientY);
  },true);
  document.addEventListener('change',e=>{if(e.target.matches('.favorite-choice input[name="favorite"]'))feedback(e.target.closest('.favorite-choice'),e.target.checked);});
  let lastZoom=getComputedStyle(document.documentElement).zoom;
  new MutationObserver(changes=>{const zoom=getComputedStyle(document.documentElement).zoom;if(zoom!==lastZoom||changes.some(c=>c.attributeName==='data-motion'||c.attributeName==='data-theme'))document.querySelectorAll('.favorite-feedback').forEach(e=>e.remove());lastZoom=zoom;}).observe(document.documentElement,{attributes:true,attributeFilter:['style','data-motion','data-theme']});
  const results=document.getElementById('live-results'),icon=document.querySelector('.search-live-indicator');
  const busy=()=>{const loading=results.getAttribute('aria-busy')==='true';icon.classList.toggle('is-loading',loading);icon.textContent=loading?'':'⌕';};
  new MutationObserver(busy).observe(results,{attributes:true,attributeFilter:['aria-busy']});busy();
})();
