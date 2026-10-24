// Shared feedback is delegated so it survives card and dialog re-renders.
(function(){
  const reduce=()=>document.documentElement.dataset.motion==='reduced'||(document.documentElement.dataset.motion!=='full'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function feedback(trigger,adding,x,y){
    if(reduce())return;
    const rect=trigger.getBoundingClientRect();
    const effect=document.createElement('div');effect.className='favorite-feedback'+(adding?'':' is-removing');effect.setAttribute('aria-hidden','true');
    effect.style.left=((x||rect.left+rect.width/2))+'px';effect.style.top=((y||rect.top+rect.height/2))+'px';
    effect.innerHTML='<span>♥</span>'+Array.from({length:6},(_,i)=>`<i style="--angle:${i*60}deg"></i>`).join('');
    (trigger.closest('dialog')||document.body).append(effect);
    setTimeout(()=>effect.remove(),750);
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest('.favorite-control,.favorite-toggle,#favorite,[data-menu-action="favorite"]');if(!button)return;
    const before=button.hasAttribute('aria-pressed')?button.getAttribute('aria-pressed')==='true':/favorited|unfavorite|remove favorite/i.test(button.textContent);
    feedback(button,!before,e.clientX,e.clientY);
  },true);
  document.addEventListener('change',e=>{if(e.target.matches('.favorite-choice input[name="favorite"]'))feedback(e.target.closest('.favorite-choice'),e.target.checked);});
  const results=document.getElementById('live-results'),icon=document.querySelector('.search-live-indicator');
  const busy=()=>{const loading=results.getAttribute('aria-busy')==='true';icon.classList.toggle('is-loading',loading);icon.textContent=loading?'':'⌕';};
  new MutationObserver(busy).observe(results,{attributes:true,attributeFilter:['aria-busy']});busy();
})();
