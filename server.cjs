const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'dist');
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||5174);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535');
const metadataProxy=require('./metadata-proxy.cjs');
http.createServer(async(req,res)=>{if(await metadataProxy(req,res))return;let file;try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))throw Error();}catch{res.writeHead(400);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(data);});}).listen(port,host,()=>console.log('Folio v0.3.0 listening on '+host+':'+port));

