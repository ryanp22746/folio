/* Provider galleries and local display choices; never change provider identities. */
(function(root){
 const key='folio-artwork-v1';
 const safe=value=>{if(typeof value!=='string')return '';if(/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value))return value;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?value:'';}catch{return '';}};
 const unique=values=>[...new Set(values.map(safe).filter(Boolean))];
 function preferences(){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function keys(m){return [...new Set([m.id,...(m.source_records||[]).map(r=>r.id),...Object.entries(m.external_ids||{}).map(([provider,id])=>`${provider}:${m.kind}:${id}`)].filter(Boolean))];}
 function gallery(m,entry){
  const rows=[m,...(m.source_records||[])],prefs=preferences(),pref=Object.assign({},...keys(m).reverse().map(id=>prefs[id]||{}),entry?.artworkChoices||{});
  const portraits=unique([entry?.coverImage,entry?.coverUrl,...rows.flatMap(r=>(r.image_sexual>0||r.image_violence>1)?[]:[r.image_url,...(r.portrait_urls||[])]),pref.portrait]);
  const backgrounds=unique([entry?.backgroundImage,entry?.backgroundUrl,...rows.flatMap(r=>[r.backdrop_url,...(r.backdrop_urls||[])]),pref.background]);
  return {portraits,backgrounds,portrait:portraits.includes(pref.portrait)?pref.portrait:portraits[0]||'',background:pref.background===''?'':backgrounds.includes(pref.background)?pref.background:backgrounds[0]||''};
 }
 function save(id,type,value,aliases=[]){
  if(!['portrait','background'].includes(type))return false;
  const prefs=preferences(),prior=prefs[id]||{};delete prefs[id];
  // Keep uploaded data only on the primary preference key, not every alias.
  if(value==='auto')delete prior[type];else if(value===''||safe(value))prior[type]=value;else return false;
  for(const alias of new Set([id,...aliases])){delete prefs[alias];prefs[alias]={...prior};if(alias!==id){for(const type of ['portrait','background'])if(prefs[alias][type]?.startsWith('data:'))delete prefs[alias][type];}}const bounded=Object.fromEntries(Object.entries(prefs).slice(-200));
  try{localStorage.setItem(key,JSON.stringify(bounded));return true;}catch{return false;}
 }
 function choices(m){const prefs=preferences();return Object.assign({},...keys(m).reverse().map(id=>prefs[id]||{}));}
 const api={gallery,save,keys,choices};if(typeof module==='object')module.exports=api;else root.FolioArtwork=api;
})(globalThis);
