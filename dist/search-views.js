/* Search layouts share the same results and actions. */
(function(){
 const key='folio-search-view-v1';let layout='grid';try{const saved=localStorage.getItem(key);if(['grid','list','text'].includes(saved))layout=saved;}catch{}
 const controls=document.createElement('div');controls.className='search-view-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Search layout');
 const results=document.querySelector('#live-results');
 function paint(){results.dataset.layout=layout;for(const b of controls.children)b.setAttribute('aria-pressed',String(b.dataset.searchView===layout));}
 for(const value of ['grid','list','text']){const b=document.createElement('button');b.type='button';b.dataset.searchView=value;b.textContent=value[0].toUpperCase()+value.slice(1);b.setAttribute('aria-label',value==='text'?'Search text view':value==='list'?'Search list view':'Search grid view');b.onclick=()=>{layout=value;try{localStorage.setItem(key,value);}catch{}paint();};controls.append(b);}
 document.querySelector('.search-browse-controls').append(controls);paint();
})();
