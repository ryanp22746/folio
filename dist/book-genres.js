/* Open Library subjects are catalog taxonomy, not ready-to-display genres.
   Keep a conservative set of recognized genres; personal tags stay untouched. */
(function(root){
const aliases={
 'Science fiction':['science fiction','science-fiction','ciencia-ficción','ciencia ficcion','sciencefiction','sci-fi'],
 'Fantasy':['fantasy','fantasy fiction'],
 'Horror':['horror','horror fiction','horror tales'],
 'Mystery':['mystery','mystery fiction','detective and mystery stories'],
 'Thriller':['thriller','thrillers','suspense fiction'],
 'Romance':['romance','romance fiction','love stories'],
 'Historical fiction':['historical fiction'],
 'Adventure':['adventure','adventure fiction','adventure stories'],
 'Literary fiction':['literary fiction'],
 'Nonfiction':['nonfiction','non-fiction'],
 'Biography':['biography','autobiography','biographies'],
 'Memoir':['memoir','memoirs'],
 'History':['history'],
 'Poetry':['poetry','poems'],
 'Comics':['comics','graphic novels','comic books, strips, etc.'],
 'Young adult':['young adult fiction','young adult literature'],
 'Children’s literature':["children's fiction","children's literature",'juvenile fiction']
};
function clean(subjects){
 const found=new Set();
 for(const raw of subjects||[]){
  if(typeof raw!=='string'||/[:=_]|https?:|award|prize|bestseller/i.test(raw))continue;
  const parts=raw.toLowerCase().trim().split(/[,;]/).map(s=>s.trim());
  for(const [genre,terms] of Object.entries(aliases))if(terms.includes(raw.toLowerCase().trim())||parts.some(p=>terms.includes(p)))found.add(genre);
 }
 return [...found];
}
function forMedia(media){return media?.source?.provider==='openlibrary'?clean(media.genres):media?.genres||[];}
const api={clean,forMedia};if(typeof module!=='undefined')module.exports=api;else root.FolioBookGenres=api;
})(typeof globalThis!=='undefined'?globalThis:this);
