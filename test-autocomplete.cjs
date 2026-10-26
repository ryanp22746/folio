const assert=require('node:assert/strict');
const {Trie,build,suggest,distance,remember}=require('./dist/autocomplete.js');
const trie=new Trie();trie.add('Beyoncé','artist');trie.add('Berserk','manga');assert(trie.find('beyon').has('artist'));assert(!trie.find('xx').size);
const index=build([{id:'m1',title:'Berserk',kind:'manga',aliases:['Beruseruku'],creators:['Kentaro Miura'],genres:['Dark Fantasy'],popularity:100},{id:'g1',title:'Berzerk',kind:'game',genres:['Shooter'],popularity:1},{id:'f1',title:'Interstellar',kind:'movie',creators:['Christopher Nolan'],genres:['Science Fiction']},{id:'p1',title:'Portal 2',kind:'game'}]);
assert.equal(suggest(index,'bers')[0].id,'m1');
assert.equal(suggest(index,'bersrek')[0].id,'m1');
assert.equal(suggest(index,'beruseruku')[0].id,'m1');
assert.equal(suggest(index,'miura fantasy')[0].id,'m1');
assert.equal(suggest(index,'Nolan sci fi')[0].id,'f1');
assert.equal(suggest(index,'portal')[0].id,'p1');
assert.deepEqual(suggest(index,'bers','movie'),[]);
assert.equal(distance('bersrek','berserk'),1);
let history=remember([],'Portal 2','game','igdb',1);history=remember(history,'portal 2','game','igdb',2);assert.equal(history.length,1);assert.equal(history[0].at,2);
history=remember(history,'Portal 2','movie','tmdb',3);assert.equal(history.length,2);
for(let i=0;i<50;i++)history=remember(history,'Title '+i,'','',i);assert.equal(history.length,20);
assert.equal(remember(history,' ').length,20);
assert.equal(build(Array.from({length:1000},(_,i)=>({id:String(i),title:'Title '+i}))).rows.length,600);
assert.deepEqual(suggest(index,'zqxnonexistent'),[]);
console.log('Autocomplete trie, aliases, concept matching, typo correction, media constraints and bounded local history passed');

const repeated=build([...Array.from({length:20},(_,i)=>({id:'same'+i,title:'Portal',kind:'game'})),{id:'sequel',title:'Portal 2',kind:'game'}]);
assert(suggest(repeated,'portal').some(row=>row.id==='sequel'),'duplicate source titles must not crowd out distinct completions');

