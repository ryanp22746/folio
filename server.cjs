const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'dist');
const metadataProxy=require('./metadata-proxy.cjs');
http.createServer(async(req,res)=>{if(await metadataProxy(req,res))return;let file;try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))throw Error();}catch{res.writeHead(400);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(data);});}).listen(5174,'127.0.0.1',()=>console.log('Library preview ready: http://127.0.0.1:5174/'));

