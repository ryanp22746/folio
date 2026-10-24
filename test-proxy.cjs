const assert=require('node:assert/strict');
const proxy=require('./metadata-proxy.cjs');
async function run(){
 const call=async(url,method='GET',headers={})=>{let status,body;const res={writeHead:s=>status=s,end:b=>body=JSON.parse(b)};await proxy({url,method,headers},res);return {status,body};};
 delete process.env.METADATA_API_KEY;
 assert.equal((await call('/api/metadata/providers')).status,503);
 process.env.METADATA_API_BASE_URL='http://127.0.0.1:8000';process.env.METADATA_API_KEY='test-only-service-secret';
 global.fetch=async(url,options)=>{assert.equal(url.origin,'http://127.0.0.1:8000');assert.equal(options.headers.Authorization,'Bearer test-only-service-secret');assert.equal(options.redirect,'error');return new Response(JSON.stringify({results:[]}));};
 assert.equal((await call('/api/metadata/search?q=test')).status,200);
 assert.equal((await call('/api/metadata/search','POST')).status,405);
 assert.equal((await call('/api/metadata/search','GET',{'sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await call('/api/metadata/evil')).status,400);
 console.log('Proxy tests passed');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
