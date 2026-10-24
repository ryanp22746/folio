const assert=require('node:assert/strict');const {same,possible}=require('./dist/identity.js');
const item=(id,kind,ids)=>({id,title:'Same title',type:kind,metadata:{kind,external_ids:ids}});
assert(same(item('a','movie',{imdb:'tt1'}),item('b','movie',{imdb:'tt1'})));
assert(!same(item('a','movie',{imdb:'tt1'}),item('b','tv',{imdb:'tt1'})));
assert(!same(item('a','movie',{}),item('b','movie',{})));
assert(possible(item('a','movie',{}),item('b','movie',{})));
console.log('Identity tests passed');
