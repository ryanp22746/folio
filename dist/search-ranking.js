(function(root){
  const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const compact=s=>normalize(s).replaceAll(' ','');
  function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]!==b[j-1]));row=next;}return row[b.length];}
  function variants(q){const words=normalize(q).split(' ');return words.length>=2&&words.length<=4&&words.every(w=>/^\p{L}{2,}$/u.test(w))?[q,words.join('')]:[q];}
  function relevance(m,q){const query=normalize(q),c=compact(q),titles=[m.title,m.original_title,...(m.creators||[]).map(a=>m.title+' '+a)].filter(Boolean).map(normalize);return Math.max(...titles.map(t=>{const x=compact(t);if(x===c)return 4;if(c.length>=5&&x.length<=120&&Math.abs(c.length-x.length)<=2&&distance(c,x)<=Math.max(1,Math.floor(c.length*.12)))return 3.5;return t.startsWith(query+' ')?3:t.includes(query)?2:query.split(' ').every(w=>t.split(' ').includes(w))?1:0;}));}
  function prominence(m){const scale={tmdb:10000,igdb:1000,mangaupdates:3000,vndb:3000,musicbrainz:20,anilist:10000}[m.source.provider]||1000;const votes=Math.min(1.2,Math.log1p(Math.max(0,m.rating_count||0))/Math.log1p(scale));const trend=Math.min(.2,Math.log1p(Math.max(0,m.popularity||0))/50);const age=Math.max(0,new Date().getFullYear()-Number(m.release_date?.slice(0,4)||0));return Math.max(votes,m.search_priority||0)+trend+((votes||m.search_priority)?0.03/(1+age):0);}
  function rank(records,q){return records.map((m,i)=>({m,i})).sort((a,b)=>relevance(b.m,q)-relevance(a.m,q)||prominence(b.m)-prominence(a.m)||a.i-b.i).map(x=>x.m);}
  function score(value){return String(value).replace(/\d+\.\d+/g,n=>Number(n).toFixed(1));}
  const api={normalize,rank,variants,score};if(typeof module==='object')module.exports=api;else root.FolioSearch=api;
})(typeof window==='object'?window:globalThis);
