const assert=require('node:assert/strict'),upgrade=require('./dist/library-upgrade.js');
const entry={id:'demo-3',title:'Blonde',type:'Music',creator:'Frank Ocean',year:2016,status:'Completed',rating:9,favorite:true,notes:'Personal',sessions:[{id:'session'}],journal:[{body:'Note'}],episodeProgress:{completed:5},coverImage:'my-art'};
const media={id:'apple:album:1',kind:'album',title:'Blonde',release_date:'2016-08-20',creators:['Frank Ocean'],source:{provider:'apple'}};
assert(upgrade.matches(entry,media));assert(!upgrade.matches(entry,{...media,creators:['Other artist']}));assert(!upgrade.matches(entry,{...media,release_date:'2020'}));assert(!upgrade.matches(entry,{...media,kind:'track'}));assert.equal(upgrade.select(entry,[media,{...media,id:'other'}]),null);
const converted={sources:[],year:'2016',creator:'Frank Ocean',genre:'R&B',coverUrl:'https://art.test/cover.jpg',description:'Live description'};
const updated=upgrade.patch(entry,media,converted);
for(const field of ['id','title','status','rating','favorite','notes','sessions','journal','episodeProgress','coverImage'])assert.deepEqual(updated[field],entry[field]);
assert.equal(updated.coverUrl,undefined);assert.equal(updated.metadata,media);assert.equal(upgrade.patch({...entry,coverImage:''},media,converted).coverUrl,converted.coverUrl);
assert(upgrade.matches({title:'Baldur’s Gate 3',type:'Game',year:2023},{title:"Baldur's Gate 3",kind:'game',release_date:'2023-08-03',source:{provider:'igdb'}}));
assert(upgrade.matches({title:'Spirited Away',type:'Anime',year:2001},{title:'Spirited Away',kind:'movie',release_date:'2001-07-20',source:{provider:'tmdb'}}));
console.log('Library upgrade matching and personal-data preservation tests passed');

const before={items:[entry],collections:[{id:'collection',members:[entry.id]}]};
assert.deepEqual(upgrade.integrity(before,[updated],before.collections),{original:1,retained:1,changed:0,collectionsUnchanged:true});
assert.equal(upgrade.integrity(before,[{...updated,notes:'Edited'}],before.collections).changed,1);
assert.equal(upgrade.integrity(before,[],before.collections).retained,0);

assert(upgrade.matches({title:"Title 3",type:'Game',year:2023},{title:'Title III',alternative_titles:['Title 3'],kind:'game',release_date:'2023-01-01',source:{provider:'igdb'}}));
assert(!upgrade.matches({title:'Arrival',type:'Movie',year:2016,creator:'Denis Villeneuve'},{title:'Arrival',kind:'movie',release_date:'2016-01-01',creators:['Another director'],source:{provider:'tmdb'}}));
