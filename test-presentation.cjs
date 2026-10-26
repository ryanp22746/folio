const assert=require('node:assert/strict');
const {coordinates}=require('./dist/interactions.js');
const {companyMatches}=require('./dist/creators.js');
for(const zoom of [.5,.7,1,1.3,1.75]){
 const p=coordinates(500,320,zoom,null);assert.equal(p.x*zoom,500);assert.equal(p.y*zoom,320);
 const box={left:100,top:50,scale:zoom,scrollLeft:0,scrollTop:280,clientLeft:1,clientTop:1};
 const local=coordinates(500,320,zoom,box);assert(Math.abs((local.x+1)*zoom+100-500)<.001);assert(Math.abs((local.y-280+1)*zoom+50-320)<.001);
}
const refs=[{provider:'igdb',id:'908',name:'CD Projekt RED'},{provider:'igdb',id:'2',name:'CD Projekt Red North America'},{provider:'tmdb',id:'3',name:'CD PROJEKT RED'}];
assert.deepEqual(companyMatches(refs,'CD PROJEKT RED').map(r=>r.id),['908']);
assert.deepEqual(companyMatches([{provider:'tmdb_company',id:'1',name:'Trigger'},{provider:'tmdb_company',id:'2',name:'TRIGGER'}],'Trigger'),[]);
assert.deepEqual(companyMatches([{provider:'tmdb',id:'1',name:'A Person'}],'A Person'),[]);
const {reconcile}=require('./dist/library-patch.js');
const openEntry={id:'1',rating:5,notes:'Old',completionPreviousStatus:'In progress'};
const refreshed=reconcile([openEntry],[{id:'1',rating:8,notes:'Edited in another tab',favorite:true}]);
assert.equal(refreshed[0],openEntry);assert.equal(openEntry.rating,8);assert.equal(openEntry.notes,'Edited in another tab');assert.equal(openEntry.favorite,true);assert(!('completionPreviousStatus' in openEntry));
console.log('Feedback coordinates survive zoom and scroll; company matches exclude branches, ambiguity and people');
const vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('./dist/metadata.js','utf8');
let calls=0;const paths=[];
const context={liveSearchCache:require('./dist/live-search.js').createCache(),FolioLiveSearch:require('./dist/live-search.js'),fetch:async path=>{paths.push(path);const version=++calls;return {ok:true,json:async()=>({version,providers:[{status:'ok'}]})};}};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function metadataGet'),source.indexOf('function searchBusy')),context);
(async()=>{assert.equal((await context.metadataGet('search?q=test')).version,1);assert.equal((await context.metadataGet('search?q=test')).version,1);assert.equal((await context.metadataGet('search?q=test',undefined,true)).version,2);assert(paths[1].endsWith('&refresh=true'));assert.equal((await context.metadataGet('search?q=test')).version,2);assert.equal(calls,2);console.log('Forced searches refresh both upstream and browser caches');})().catch(error=>{console.error(error);process.exitCode=1;});
