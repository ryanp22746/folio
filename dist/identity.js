(function(root){
  function keys(x){const m=x.metadata;if(!m)return [];return Object.entries(m.external_ids||{}).filter(([,v])=>typeof v==='string'&&v).map(([ns,v])=>JSON.stringify([m.kind,ns,v]));}
  function same(a,b){if(a.id===b.id)return true;const right=new Set(keys(b));return keys(a).some(k=>right.has(k));}
  function possible(a,b){return a.type===b.type&&String(a.title).normalize('NFKC').trim().toLowerCase()===String(b.title).normalize('NFKC').trim().toLowerCase();}
  const api={same,possible};if(typeof module!=='undefined')module.exports=api;else root.FolioIdentity=api;
})(globalThis);
