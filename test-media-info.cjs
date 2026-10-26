const assert=require('node:assert/strict');
const info=require('./dist/media-info.js');
const media={kind:'movie',title:'Film',source:{provider:'tmdb',fetched_at:'2026-10-24T00:00:00Z'},credits:[{name:'Actor <script>',role:'Cast',character:'Lead',url:'javascript:alert(1)'},{name:'Director',role:'Director',url:'https://www.themoviedb.org/person/1'}],facts:{Runtime:'120 minutes'},alternative_titles:['Alternative'],releases:[{date:'2026-10-24',region:'US',type:'Theatrical',certification:'PG'}],watch_status:'ok',watch_regions:{US:{url:'https://www.themoviedb.org/movie/1/watch?locale=US',offers:[{name:'Service',type:'Subscription',logo_url:'https://image.tmdb.org/t/p/w92/logo.jpg'},{name:'Service',type:'Buy'}]}},trailer_url:'https://www.youtube.com/watch?v=abcdefghijk'};
const html=info.render(media,['Drama']);
for(const label of ['Cast','Crew','Film details','Genres','Releases','Where to watch','Trailer','Runtime','Alternative'])assert(html.includes(label));
assert(html.includes('Actor &lt;script&gt;'));assert(!html.includes('javascript:'));assert(html.includes('role="tablist"'));assert(html.includes('role="tabpanel"'));
const offers=info.offers(media,'US');assert.equal((offers.match(/class="watch-service"/g)||[]).length,1);assert(offers.includes('Subscription'));assert(offers.includes('Buy'));assert(offers.includes('JustWatch'));
assert(info.offers(media,'CA').includes('No streaming, rental or purchase options reported for Canada'));
assert(info.offers({...media,watch_status:'unavailable',watch_regions:{}},'US').includes('temporarily unavailable'));
assert(info.offers({...media,watch_status:'unknown',watch_regions:{}},'US').includes('Refresh details'));
const game=info.render({kind:'game',source:{provider:'igdb'},external_ids:{steam:'620'},creators:['Valve'],platforms:['PC']},['Puzzle']);assert(game.includes('store.steampowered.com/app/620/'));assert(game.includes('Studios &amp; credits'));assert(game.includes('Platforms &amp; gameplay'));assert(!game.includes('Where to watch'));assert(game.includes('not verified'));
const book=info.render({kind:'book',source:{provider:'openlibrary',url:'https://openlibrary.org/works/OL1W'},creators:['Author']},[]);assert(book.includes('Author'));assert(book.includes('borrowing options'));assert(!book.includes('Subscription'));
const music=info.render({kind:'album',title:'In Rainbows',creators:['Radiohead'],source:{provider:'apple',url:'https://music.apple.com/us/album/1109714933'},external_ids:{apple:'1109714933'}},[]);
assert(music.includes('Where to listen'));assert(music.includes('https://open.spotify.com/search/In%20Rainbows%20Radiohead'));
assert(music.includes('YouTube Music'));assert(music.includes('Search results are not verified matches'));
const linkedMusic=info.render({kind:'album',title:'Album',creators:['Artist'],source:{provider:'musicbrainz'},media_links:[{label:'Spotify · Listen',url:'https://open.spotify.com/album/example'}]},[]);
assert(linkedMusic.includes('https://open.spotify.com/album/example'));assert(!linkedMusic.includes('https://open.spotify.com/search/'));
const spotify=info.render({kind:'track',title:'Song',creators:['Artist'],source:{provider:'spotify'},credits:[{name:'Artist',role:'Artist',url:'https://open.spotify.com/artist/7tFehEdzjjoeiwUExR89qs'}],media_links:[{label:'Spotify · Listen',url:'https://open.spotify.com/track/1234567890123456789012'}]},[]);
assert(spotify.includes('service-spotify'));assert(spotify.includes('https://open.spotify.com/track/1234567890123456789012'));assert(!spotify.includes('open.spotify.com/search/'));assert(spotify.includes('creator-chip'));
const tabs=html=>Array.from(html.matchAll(/role="tab"[^>]*>(.*?)<\/button>/g),m=>m[1].replaceAll('&amp;','&'));
const base={source:{provider:'test'},release_date:'2000',creators:['Person']};
for(const [kind,labels] of Object.entries({
 movie:['Crew','Film details','Releases'],tv:['Creators & crew','Series details','Air dates'],anime:['Staff','Anime details','Release dates'],
 game:['Studios & credits','Game details','Release dates'],visual_novel:['Developers & staff','Novel details','Release dates'],
 album:['Artists & credits','Album details','Editions & releases'],track:['Artists & credits','Recording details','Releases'],
 book:['Authors & contributors','Book details','Publication history'],manga:['Authors & artists','Publication details','Publication history']
})){
 const html=info.render({...base,kind},[]);assert.deepEqual(tabs(html),labels);
 assert(!html.includes('No cast supplied'));assert(!tabs(html).includes('Genres'));
 if(!['movie','tv'].includes(kind))assert(!tabs(html).includes('Crew'));
}
const vn=info.render({...base,kind:'visual_novel',facts:{'Typical length':'600 minutes'},platforms:['Windows']},['Mystery']);
assert(tabs(vn).includes('Playing information'));assert(tabs(vn).includes('Genres & tags'));assert(vn.includes('<dt>Developer</dt>'));assert(vn.includes('Where to play'));
const vnStaff=info.render({...base,kind:'visual_novel',credits:[{name:'Maruto Fumiaki',role:'Writer / scenario',url:'https://vndb.org/s216',note:'Original <script> name; Edition: Console'},{name:'Voice actor',role:'Cast',character:'Hero',url:'https://vndb.org/s1'}]},[]);
assert(tabs(vnStaff).includes('Voice cast'));assert(vnStaff.includes('https://vndb.org/s216'));
assert(vnStaff.includes('Writer / scenario'));assert(vnStaff.includes('Original &lt;script&gt; name; Edition: Console'));assert(!vnStaff.includes('<script>'));
const anime=info.render({...base,kind:'anime',credits:[{role:'Cast',name:'Voice actor',character:'Hero'},{role:'Director',name:'Director'}]},['Drama']);
assert(tabs(anime).includes('Voice cast'));assert(tabs(anime).includes('Staff'));assert(anime.includes('Hero'));
const manga=info.render({...base,kind:'manga',format:'Manhwa',credits:[{role:'Author',name:'Writer'},{role:'Artist',name:'Illustrator'}]},['Action']);
assert(manga.includes('Manhwa'));assert(manga.includes('<dt>Author</dt>'));assert(manga.includes('<dt>Artist</dt>'));assert(manga.includes('First publication'));assert(manga.includes('Where to read'));
const credits=info.render({...base,kind:'game',creators:['Developer'],credits:[{role:'Developer',name:'Developer'},{role:'Publisher',name:'Publisher'}],facts:{'Game modes':'Single player',Perspective:'First person'}},[]);
assert.equal((credits.match(/>Developer<\/button>/g)||[]).length,1);assert(credits.includes('Platforms &amp; gameplay'));assert(credits.includes('First person'));
assert.deepEqual(tabs(info.render({kind:'book',source:{provider:'openlibrary'}},[])),['Book details']);
const appleDate=info.render({...base,kind:'album',source:{provider:'apple'}},[]);assert(appleDate.includes('Catalog release date'));assert(!appleDate.includes('First released'));
assert(info.render({...base,kind:'album',format:'Single'},[]).includes('Music release details'));
console.log('Media-specific sections for all nine kinds, missing-data handling, credits, attribution, availability and safe links passed');

const manyCredits=Array.from({length:30},(_,i)=>({name:'Writer '+i,role:'Writer',note:'Full credit '+i}));
const compact=info.render({...media,kind:'visual_novel',credits:manyCredits},[]);
assert.match(compact,/Show 24 more credits/);
assert.match(compact,/aria-description="Full credit 0"/);
