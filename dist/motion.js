// Progressive motion enhancement: never delays actions or changes focus/scroll ownership.
(function(root){
 const active=new Set(),running=new WeakMap(),os=matchMedia('(prefers-reduced-motion: reduce)');
 function allowed(){const mode=document.documentElement.dataset.motion;return mode!=='reduced'&&(mode==='full'||!os.matches);}
 function animate(element,kind='reveal',index=0){
  if(!allowed()||!element.isConnected||!element.getBoundingClientRect().width)return;
  running.get(element)?.cancel();
  const playful=document.documentElement.dataset.motion==='full'&&document.documentElement.dataset.theme!=='yotsuba';
  const movement=kind==='dialog'? (playful?18:7):kind==='menu'? (playful?-8:-3):5;
  const frames=kind==='expand'?[{opacity:.65},{opacity:1}]:[
   {opacity:0,transform:`translateY(${movement}px) scale(${playful&&kind==='dialog'?.96:1})`},
   {opacity:1,transform:'translateY(0) scale(1)'}
  ];
  const animation=element.animate(frames,{duration:playful?280:160,delay:Math.min(index,7)*18,easing:playful?'cubic-bezier(.2,.8,.2,1.12)':'cubic-bezier(.2,.7,.3,1)'});
  active.add(animation);running.set(element,animation);
  const done=()=>{active.delete(animation);if(running.get(element)===animation)running.delete(element);};
  animation.onfinish=done;animation.oncancel=done;
 }
 function sync(){
  document.documentElement.dataset.uiMotion=allowed()?'on':'off';
  if(!allowed()){for(const animation of active)animation.cancel();active.clear();}
 }
 new MutationObserver(changes=>{
  let index=0;
  for(const change of changes){
   const el=change.target;
   if(change.type==='attributes'){
    if(change.attributeName==='open'&&el.matches('dialog')){if(el.open)animate(el,'dialog');else running.get(el)?.cancel();}
    if(change.attributeName==='hidden'&&!el.hidden&&el.matches('#item-menu,#live-add-fields,#bulk-bar,.info-panel'))animate(el,el.id==='item-menu'?'menu':'reveal');
    if(change.attributeName==='data-expanded'&&el.open)animate(el,'expand');
   }else for(const node of change.addedNodes){
    if(node.nodeType!==1)continue;
    if(node.matches('.discover-card,.library-item')&&!node.dataset.reconciled&&index<8)animate(node,'reveal',index++);
   }
  }
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','data-expanded']});
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion','data-theme']});
 document.addEventListener('toggle',event=>{if(event.target.matches('details[open]')){for(const child of [...event.target.children].filter(e=>e.tagName!=='SUMMARY'))animate(child);}},true);
 os.addEventListener('change',sync);sync();
 root.FolioMotion={allowed};
})(globalThis);
