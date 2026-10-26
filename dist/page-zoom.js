(function(){
 const key='folio-page-zoom-v1';let scale=1;try{scale=Number(localStorage.getItem(key))||1;}catch{}
 const controls=document.createElement('div');controls.className='page-zoom-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Page zoom');
 const label=document.createElement('span');label.textContent='Page zoom';const out=document.createElement('output');out.setAttribute('aria-live','polite');
 function set(value){scale=Math.max(.5,Math.min(1.75,Math.round(value*100)/100));document.documentElement.style.zoom=scale;document.documentElement.style.setProperty('--app-zoom',String(scale));out.textContent=Math.round(scale*100)+'%';try{localStorage.setItem(key,String(scale));}catch{}}
 controls.append(label);for(const [text,aria,fn] of [['−','Zoom out',()=>set(scale-.1)],['+','Zoom in',()=>set(scale+.1)],['Reset','Reset page zoom',()=>set(1)]]){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',aria);b.onclick=fn;controls.append(b);}controls.append(out);document.querySelector('#preferences-dialog .preferences-section')?.append(controls);if(!controls.isConnected)document.querySelector('#preferences-dialog').append(controls);
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||!['+','=','-','_','0'].includes(e.key))return;e.preventDefault();set(e.key==='0'?1:scale+(['-','_'].includes(e.key)?-.1:.1));});
 let last=0;document.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();if(Date.now()-last<60)return;last=Date.now();set(scale+(e.deltaY>0?-.05:.05));},{passive:false});set(scale);
})();
