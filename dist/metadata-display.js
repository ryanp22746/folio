/* Presentation only: leave provider identities, proper names and filter values intact. */
(function(root){
 const canonical={'sci-fi':'Science fiction','science-fiction':'Science fiction','science fiction':'Science fiction','rpg':'RPG','jrpg':'JRPG','fps':'FPS','r&b':'R&B','edm':'EDM','tv':'TV','ova':'OVA','ona':'ONA','pc':'PC','pc (microsoft windows)':'PC (Windows)','win':'Windows','windows':'Windows','ios':'iOS','macos':'macOS','mac':'Mac','lin':'Linux','linux':'Linux','ps4':'PlayStation 4','ps5':'PlayStation 5','lgbtq':'LGBTQ','hip-hop':'Hip-hop','hip hop':'Hip-hop','single player':'Single-player','single-player':'Single-player','multiplayer':'Multiplayer'};
 function label(value){const text=String(value??'').trim().replace(/_/g,' ').replace(/\s+/g,' ').replace(/\br&b\b/gi,'R&B');return canonical[text.toLowerCase()]||text.replace(/^\p{Ll}/u,c=>c.toUpperCase());}
 function genres(values){return [...new Map((values||[]).map(v=>label(v)).filter(Boolean).map(v=>[v.toLocaleLowerCase(),v])).values()];}
 function fact(key,value){return /^(Format|Status|Source material|Season|Game modes|Perspective|Themes|Platforms|Age rating)$/i.test(key)?String(value).split(/\s*[·,]\s*/).map(label).join(' · '):value;}
 const api={label,genres,fact};if(typeof module==='object')module.exports=api;else root.FolioMetadataDisplay=api;
})(globalThis);
