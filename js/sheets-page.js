// =========================================================
// sheets-page.js — tiny shared helpers for pages that start EMPTY
// (every capsule is hidden in the HTML and only appears when the
//  Google Sheet has data for it). Load it after sheets-core.js.
// =========================================================
(function () {

  // Load a picture and tell us if it worked. Resolves to the <img> or null.
  function loadImage(src, alt) {
    return new Promise(resolve => {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.alt = alt || '';
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Run the page's sections side by side.
  //   sections: [ ['label', async () => true/false], ... ]
  //     true  = this section has something to show
  //     false = nothing in the sheet for it (it stays hidden)
  //     throw = the sheet couldn't be read
  // If NOTHING ends up showing, a friendly note is displayed instead of a blank page.
  async function start(sections, opts) {
    const note = opts.note;
    const results = await Promise.all(sections.map(async ([label, fn]) => {
      try { return (await fn()) ? 'shown' : 'empty'; }
      catch (err) {
        console.warn('[sheet] "' + label + '" not loaded.', err);
        return 'error';
      }
    }));
    if (!note) return;
    if (results.includes('shown')) { note.hidden = true; return; }
    note.textContent = results.includes('error') ? opts.errorText : opts.emptyText;
    note.hidden = false;
  }

  window.SheetsPage = { loadImage, start };
})();
