const assert=require('node:assert/strict');
const genres=require('./dist/book-genres.js');
const messy=['Ciencia-ficción','Hugo Award Winner','award:hugo_award=1970','award:hugo_award=novel','human nature','gender','space travel','ice age','Science fiction','American literature','Fiction, science fiction, general','LGBTQ gender identity'];
assert.deepEqual(genres.clean(messy),['Science fiction']);
assert.deepEqual(genres.clean(['Fantasy fiction','Fantasy','Historical fiction','Romance','https://bad.test']),['Fantasy','Historical fiction','Romance']);
assert.deepEqual(genres.clean([null,42,{},'nyt:series_books=2010']),[]);
const saved={source:{provider:'openlibrary'},genres:messy};
assert.deepEqual(genres.forMedia(saved),['Science fiction']);
assert.deepEqual(saved.genres,messy); // Display cleanup never changes saved or personal fields.
assert.deepEqual(genres.forMedia({source:{provider:'igdb'},genres:['Role-playing (RPG)']}),['Role-playing (RPG)']);
console.log('Book genres: cached taxonomy cleanup, deduplication and source isolation passed');
