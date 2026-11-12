// =========================================================
// sheet-about.js — fills about.html from the Google Sheet.
//   About tab    -> one card per row (title + text)
//   Pictures tab -> the photo on the right ("about-photo")
// The cards and the photo each appear only if the sheet has them.
// =========================================================
(function () {
  const core = window.SheetsCore, page = window.SheetsPage;
  const $ = id => document.getElementById(id);
  const note = $('emptyNote');

  if (!core || !core.ready || !page) {
    if (note) { note.textContent = "Nothing has been posted here yet. Check back soon!"; note.hidden = false; }
    return;
  }

  let hasCards = false, hasPhoto = false;
  function layout() {                            // one column if only the cards OR only the photo
    $('aboutGrid').hidden = !(hasCards || hasPhoto);
    $('aboutGrid').classList.toggle('single', !(hasCards && hasPhoto));
  }

  page.start([
    ['About', async () => {
      const rows = (await core.load('About', 'title')).filter(r => r.title);
      const column = $('aboutCards');
      column.textContent = '';
      rows.forEach(r => {
        const card = core.make('div', 'about-card');
        card.appendChild(core.make('h2', '', r.title));
        const p = core.make('p', '', r.text);
        p.style.whiteSpace = 'pre-line';          // keeps line breaks typed inside the cell
        card.appendChild(p);
        column.appendChild(card);
      });
      hasCards = rows.length > 0;
      column.hidden = !hasCards;
      layout();
      return hasCards;
    }],
    ['About photo', async () => {
      const row = (await core.load('Pictures', 'slot')).find(r => r.slot.toLowerCase() === 'about-photo');
      const img = row ? await page.loadImage(core.image(row.image), row.alt || 'About photo') : null;
      if (img) {
        const box = $('aboutPhoto');
        box.insertBefore(img, box.firstChild);
        box.hidden = false;
      }
      hasPhoto = !!img;
      layout();
      return hasPhoto;
    }],
  ], {
    note,
    emptyText: 'Nothing has been posted here yet. Check back soon!',
    errorText: "We couldn't load this page right now. Please refresh in a moment.",
  });
})();
