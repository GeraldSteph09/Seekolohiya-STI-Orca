// =========================================================
// sheet-home.js — fills index.html from the Google Sheet.
// Every capsule starts hidden; it only appears if the sheet has data.
//   Events tab   -> EVENTS panel
//   Booths tab   -> BOOTHS panel (pictures; optional caption)
//   Pictures tab -> home-photo-1, home-photo-2, booths-picture, events-picture
//   Blogs tab    -> the BLOG pill under APPLICATION (hidden unless a blog is open)
// =========================================================
(function () {
  const core = window.SheetsCore;
  if (!core || !core.ready) return;            // sheet not connected: everything stays hidden

  const $ = id => document.getElementById(id);

  // A column shows only if at least one thing inside it is showing.
  function syncCol(id) {
    const col = $(id);
    if (col) col.hidden = [...col.children].every(child => child.hidden);
  }

  // ---------------- EVENTS ----------------
  core.run('Events', async () => {
    const items = (await core.load('Events', 'title')).filter(r => r.title);
    const panel = $('eventsPanel');
    const box = panel.querySelector('.panel-scroll');
    box.textContent = '';
    items.forEach(item => {
      const div = core.make('div', 'panel-item', item.title);
      if (item.description) div.appendChild(core.make('small', '', item.description));
      box.appendChild(div);
    });
    panel.hidden = !items.length;
    syncCol('eventsCol');
  });

  // ---------------- BOOTHS ----------------
  core.run('Booths', async () => {
    const items = (await core.load('Booths', 'photo')).filter(r => core.image(r.photo));
    const panel = $('boothsPanel');
    const box = panel.querySelector('.panel-scroll');
    box.textContent = '';
    items.forEach(item => box.appendChild(boothCard(item, panel, box)));
    panel.hidden = !items.length;
    syncCol('boothsCol');
  });

  function boothCard(item, panel, box) {
    const label = item.alt || 'booth';
    const wrap = core.make('div', 'booth-photo');
    const photo = core.make('div', 'panel-photo group-photo');
    photo.tabIndex = 0;
    photo.setAttribute('role', 'button');
    photo.setAttribute('aria-label', 'Click to view ' + label + ' photo larger');

    const img = new Image();
    img.alt = item.alt || 'Booth photo';
    img.onerror = () => {                       // picture missing -> drop it
      wrap.remove();
      if (!box.children.length) { panel.hidden = true; syncCol('boothsCol'); }
    };
    img.src = core.image(item.photo);
    photo.appendChild(img);
    wrap.appendChild(photo);
    if (item.caption) wrap.appendChild(core.make('p', 'panel-photo-caption', item.caption));
    return wrap;
  }

  // ---------------- PICTURES ----------------
  core.run('Pictures', async () => {
    const pics = {};
    (await core.load('Pictures', 'slot')).forEach(r => { pics[r.slot.toLowerCase()] = r; });

    // the two photos in the left column
    ['home-photo-1', 'home-photo-2'].forEach((slot, i) => {
      const row = pics[slot];
      const src = row ? core.image(row.image) : '';
      if (!src) return;
      const frame = $('photoFrame' + (i + 1));
      const img = new Image();
      img.alt = row.alt || row.caption || '';
      img.onload = () => {
        const box = frame.querySelector('.photo-frame-photo');
        box.textContent = '';
        box.appendChild(img);
        const caption = frame.querySelector('.photo-caption');
        caption.textContent = row.caption || '';
        caption.hidden = !row.caption;
        frame.hidden = false;
        syncCol('photoCol');
      };
      img.src = src;
    });

    // the picture under BOOTHS and under EVENTS
    banner('boothsBanner', 'boothsCol', pics['booths-picture']);
    banner('eventsBanner', 'eventsCol', pics['events-picture']);
  });

  // ---------------- BLOG PILL ----------------
  // Shown only when at least one blog is open (same rule as the blog pages:
  // a title, slot 1-3, and "show" not set to no).
  //   1 open blog  -> the pill goes straight to that blog
  //   2+ open blogs -> the pill opens a short list of them
  core.run('Blogs', async () => {
    const slotOf = r => { const n = parseInt(r.slot, 10); return n >= 1 && n <= 3 ? String(n) : ''; };
    const isOpen = r => !/^(no|false|hide|hidden|draft|0)$/i.test((r.show || '').trim());
    const posts = (await core.load('Blogs', 'slot'))
      .filter(r => r.title && slotOf(r) && isOpen(r))
      .sort((a, b) => slotOf(a).localeCompare(slotOf(b)));

    const pill = $('blogPill'), menu = $('blogMenu');
    if (!pill || !posts.length) return;           // no open blogs -> the pill stays hidden

    if (posts.length === 1) {
      pill.href = 'blog' + slotOf(posts[0]) + '.html';
      pill.hidden = false;
      return;
    }

    pill.classList.add('has-menu');
    pill.setAttribute('role', 'button');
    pill.setAttribute('aria-expanded', 'false');
    pill.setAttribute('aria-controls', 'blogMenu');
    menu.textContent = '';
    posts.forEach(r => {
      const link = core.make('a', 'blog-link', r.title);
      link.href = 'blog' + slotOf(r) + '.html';
      if (r.date) link.appendChild(core.make('small', '', r.date));
      menu.appendChild(link);
    });

    const setOpen = open => {
      menu.hidden = !open;
      pill.classList.toggle('is-open', open);
      pill.setAttribute('aria-expanded', String(open));
    };
    pill.addEventListener('click', e => { e.preventDefault(); setOpen(menu.hidden); });
    pill.addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); setOpen(menu.hidden); } });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); pill.focus(); }
    });
    pill.hidden = false;
  });

  function banner(figureId, colId, row) {
    const figure = $(figureId);
    const src = row ? core.image(row.image) : '';
    if (!figure || !src) return;
    const img = new Image();
    img.alt = (row.alt || row.caption) || 'Featured picture';
    img.onload = () => {
      figure.textContent = '';
      figure.appendChild(img);
      figure.hidden = false;
      syncCol(colId);
    };
    img.onerror = () => console.warn('[sheet] picture could not load:', src);
    img.src = src;
  }
})();
