const assert=require('node:assert/strict');
const {rate,markup}=require('./dist/ratings.js');
const display=require('./dist/metadata-display.js');
const entry={id:'test',title:'A title',rating:8,status:'In progress',notes:'Keep',artworkChoices:{portrait:'custom'},episodeProgress:{completed:3}};
for(let score=0;score<=10;score++){const next=rate(entry,score);assert.equal(next.rating,score);assert.deepEqual({...next,rating:8},entry);}
assert.equal(entry.rating,8);
for(const bad of [-1,11,1.5,NaN,'5',null])assert.throws(()=>rate(entry,bad),RangeError);
const html=markup(entry);assert.equal((html.match(/role="radio"/g)||[]).length,10);assert.equal((html.match(/aria-checked="true"/g)||[]).length,1);assert(html.includes('8 out of 10 stars'));assert(!markup({...entry,title:'<script>'}).includes('<script>'));
assert.deepEqual(display.genres(['science-fiction','Science fiction','rpg','drama']),['Science fiction','RPG','Drama']);
assert.equal(display.label('ios'),'iOS');assert.equal(display.label('pc (microsoft windows)'),'PC (Windows)');
assert.equal(display.fact('Status','currently_airing'),'Currently airing');
assert.equal(display.fact('Original title','a deliberately lowercase title'),'a deliberately lowercase title');
console.log('Ratings preserve personal data; metadata labels preserve proper titles');
