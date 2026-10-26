const assert=require('node:assert/strict');
const {createCache,collect}=require('./dist/live-search.js');
(async()=>{
 let time=0;const cache=createCache(2,100,()=>time);
 cache.set('a',1);cache.set('b',2);assert.equal(cache.get('a'),1);
 cache.set('c',3);assert.equal(cache.get('b'),undefined);
 time=100;assert.equal(cache.get('a'),undefined);
 cache.set('partial',4,10);time=110;assert.equal(cache.get('partial'),undefined);
 let finishSlow;const slow=new Promise(resolve=>finishSlow=resolve),seen=[];
 const pending=collect(['slow','fast'],q=>q==='slow'?slow:Promise.resolve({results:['fast']}),(data,index)=>seen.push({data,index}));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(seen.length,1);assert.equal(seen[0].index,1);
 finishSlow({results:['slow']});await pending;assert.equal(seen.length,2);
 const partial=[];await collect(['bad','good'],q=>q==='bad'?Promise.reject(Error('offline')):Promise.resolve('good'),data=>partial.push(data));
 assert.deepEqual(partial,['good']);
 await assert.rejects(collect(['bad'],()=>Promise.reject(Error('offline')),()=>{}),/offline/);
 // Exercise the real UI request coordinator with out-of-order responses.
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('dist/metadata.js','utf8');
 const fields={'live-query':{value:'old'},'live-kind':{value:''},'live-provider':{value:''},'live-more':{},'live-status':{},'live-providers':{}};
 const requests=[],events=[];
 const context={document:{dispatchEvent:event=>events.push(event)},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},AbortController,clearTimeout,Map,liveTimer:null,searchController:null,liveSeq:0,liveLoading:false,livePage:1,liveQuery:'',liveRequest:{},liveRecords:[],liveMore:false,
  liveEl:id=>fields[id],searchBusy(){},drawResults(){},facets(){},mediaTypes:{},
  FolioLiveSearch:{collect},FolioSearch:{intent:require('./dist/search-ranking.js').intent,variants:q=>[q,q+'-variant']},URLSearchParams,
  metadataGet:path=>new Promise(resolve=>requests.push({path,resolve}))};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function loadResults('),source.indexOf('\nfunction sourceNames')),context);
 const old=vm.runInContext('loadResults()',context);fields['live-query'].value='new';const fresh=vm.runInContext('loadResults()',context);
 const batch=(id,more=false)=>({results:[{id}],providers:[],more});
 requests[0].resolve(batch('stale'));requests[1].resolve(batch('stale-variant'));await old;
 assert.equal(context.liveLoading,true);assert.equal(context.liveRecords.length,0);
 requests[3].resolve(batch('variant',true));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(context.liveRecords[0].id,'variant');assert.equal(context.liveMore,false);
 requests[2].resolve(batch('primary',true));await fresh;
 assert.deepEqual(Array.from(context.liveRecords,x=>x.id),['primary','variant']);
 assert.equal(context.liveMore,true);assert.equal(context.liveLoading,false);assert(events.every(e=>e.detail.query==='new'));assert.equal(events.at(-1).detail.finished,true);assert.equal(events.at(-1).detail.success,true);
 fields['live-query'].value='cyberpunk game';const hinted=vm.runInContext('loadResults()',context);assert.match(requests[4].path,/q=cyberpunk&kind=game/);assert(!requests[4].path.includes('cyberpunk+game'));requests[4].resolve(batch('game'));requests[5].resolve(batch('game-variant'));await hinted;
 console.log('Live search: immediate batches, partial failures, cache expiry and bounded eviction passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

const {failure}=require('./dist/live-search.js');
assert.match(failure({detail:{providers:[{provider:'anilist',status:'disabled'}]}},503),/AniList is disabled/);
assert.match(failure({detail:{provider:'igdb',status:'not_configured'}},503),/IGDB: API credentials/);
assert.match(failure({detail:{provider:'vndb',status:'unavailable'}},503),/VNDB: temporarily unavailable/);
assert.match(failure({},429),/Wait a minute/);
assert.match(failure({detail:[]},422),/compatible media type/);
assert.match(failure({},502),/metadata service is temporarily unavailable/);
