const allowed = /^\/v1\/(providers|search|items\/(tmdb|vndb|anilist|mangaupdates|igdb|musicbrainz)\/(movie|tv|anime|manga|game|album|track|visual_novel)\/[a-zA-Z0-9-]+)$/;
module.exports = async function metadataProxy(req,res) {
  const incoming = new URL(req.url,'http://localhost');
  if (!incoming.pathname.startsWith('/api/metadata/')) return false;
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(req.method!=='GET'){send(405,{detail:'GET only'});return true;}
  if(req.headers['sec-fetch-site']==='cross-site'){send(403,{detail:'Cross-site request denied'});return true;}
  const route='/v1/'+incoming.pathname.slice('/api/metadata/'.length);
  if(!allowed.test(route)||req.url.length>2048){send(400,{detail:'Invalid metadata request'});return true;}
  const base=process.env.METADATA_API_BASE_URL,key=process.env.METADATA_API_KEY;
  if(!base||!key){send(503,{detail:'Metadata API is not configured on the Folio server'});return true;}
  try{
    const target=new URL(base);
    if(target.username||target.password||!['https:','http:'].includes(target.protocol))throw Error();
    if(target.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(target.hostname))throw Error();
    target.pathname=route;target.search='';
    for(const name of ['q','kind','provider','page','enrich'])if(incoming.searchParams.has(name))target.searchParams.set(name,incoming.searchParams.get(name));
    const upstream=await fetch(target,{headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(28000)});
    const reader=upstream.body.getReader();let size=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4*1024*1024){await reader.cancel();throw Error();}chunks.push(Buffer.from(value));}
    const body=JSON.parse(Buffer.concat(chunks).toString());
    send(upstream.status,body);
  }catch{send(502,{detail:'Metadata service unavailable. Please try again later.'});}
  return true;
};
