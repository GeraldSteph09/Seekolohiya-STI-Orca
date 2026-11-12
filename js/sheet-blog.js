// =========================================================
// sheet-blog.js — fills blog1.html / blog2.html / blog3.html
//
// All three pages use this ONE file and read the SAME tab ("Blogs").
// Each page says which row it wants with  <body data-slot="1">
// (blog1.html = slot 1, blog2.html = slot 2, blog3.html = slot 3).
//
// Blogs tab columns:  slot | title | author | date | image | alt | body | show
// =========================================================
(function () {
  const core = window.SheetsCore;
  const slot = (document.body.dataset.slot || '').trim();
  const article = document.getElementById('post');
  const sideList = document.getElementById('sideList');
  const side = document.querySelector('.blog-side');
  if (!article) return;

  const NOT_PUBLISHED = "This post isn't published yet. Check back soon!";
  const COULD_NOT_LOAD = "We couldn't load this post right now. Please refresh in a moment.";

  // ---------- little helpers ----------
  function make(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
  }

  function showMessage(text) {
    article.textContent = '';
    article.appendChild(make('p', 'blog-status', text));
    const back = make('a', 'blog-back', 'Back to home');
    back.href = 'index.html';
    article.appendChild(back);
    if (side) side.hidden = true;
    if (article.parentElement) article.parentElement.classList.add('no-side');   // use the full width
  }

  // "show" column: the post is hidden only if it says no / false / hide / draft / 0
  function isPublished(row) {
    return !/^(no|false|hide|hidden|draft|0)$/i.test((row.show || '').trim());
  }

  function slotOf(row) {
    const n = parseInt(row.slot, 10);
    return n >= 1 && n <= 3 ? String(n) : '';
  }

  // Put text into an element, turning any https:// address into a real link.
  // (Text nodes + createElement only: nothing typed in the sheet can run as code.)
  function richText(el, text) {
    text.split(/(https?:\/\/[^\s]+)/g).forEach((part, i) => {
      if (i % 2 === 0) {
        if (part) el.appendChild(document.createTextNode(part));
        return;
      }
      const m = part.match(/^(.*?)([.,;:!?)\]]*)$/);       // keep a trailing "." out of the link
      const a = make('a', '', m[1]);
      a.href = m[1];
      a.target = '_blank';
      a.rel = 'noopener';
      el.appendChild(a);
      if (m[2]) el.appendChild(document.createTextNode(m[2]));
    });
  }

  // One line per paragraph.  "## text" = subheading.  "- text" = bullet.
  function renderBody(container, text) {
    let list = null;
    text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
      if (line.startsWith('- ')) {
        if (!list) { list = make('ul', 'blog-list'); container.appendChild(list); }
        const li = document.createElement('li');
        richText(li, line.slice(2).trim());
        list.appendChild(li);
        return;
      }
      list = null;
      if (line.startsWith('## ')) {
        const h = make('h2', 'blog-subheading');
        richText(h, line.slice(3).trim());
        container.appendChild(h);
      } else {
        const p = document.createElement('p');
        richText(p, line);
        container.appendChild(p);
      }
    });
  }

  const PENCIL = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  // ---------- the post itself ----------
  function renderPost(row) {
    document.title = row.title + ' — Seekolohiya';
    article.textContent = '';
    article.appendChild(make('h1', 'blog-title', row.title));

    if (row.author || row.date) {
      const meta = make('p', 'blog-meta');
      if (row.author) {
        const by = make('span', 'blog-by');
        by.insertAdjacentHTML('afterbegin', PENCIL);        // fixed icon written above, not from the sheet
        by.appendChild(document.createTextNode('By ' + row.author));
        meta.appendChild(by);
      }
      if (row.author && row.date) {
        const dot = make('span', 'blog-sep', '\u00b7');        // a dot between author and date
        dot.setAttribute('aria-hidden', 'true');
        meta.appendChild(dot);
      }
      if (row.date) meta.appendChild(make('span', 'blog-date', row.date));
      article.appendChild(meta);
    }

    const src = core.image(row.image);
    if (src) {
      const figure = make('figure', 'blog-hero');
      const box = make('div', 'group-photo');                // click-to-enlarge (see main.js)
      box.tabIndex = 0;
      box.setAttribute('role', 'button');
      box.setAttribute('aria-label', 'Click to view the picture larger');
      const img = new Image();
      img.alt = row.alt || row.title;
      img.onerror = () => figure.remove();                  // missing picture -> no broken image
      img.src = src;
      box.appendChild(img);
      figure.appendChild(box);
      article.appendChild(figure);
    }

    const body = make('div', 'blog-body');
    renderBody(body, row.body || '');
    article.appendChild(body);
  }

  // ---------- "More posts" list on the side ----------
  function renderSide(others) {
    if (!side || !sideList) return;
    sideList.textContent = '';
    if (!others.length) {
      sideList.appendChild(make('p', 'side-empty', 'No other posts yet.'));
      return;
    }
    others.forEach(row => {
      const item = make('a', 'side-item');
      item.href = 'blog' + slotOf(row) + '.html';
      const src = core.image(row.image);
      if (src) {
        const thumb = new Image();
        thumb.className = 'side-thumb';
        thumb.alt = '';
        thumb.onerror = () => thumb.remove();
        thumb.src = src;
        item.appendChild(thumb);
      }
      const text = make('span', 'side-text');
      text.appendChild(make('span', 'side-title', row.title));
      if (row.date) text.appendChild(make('span', 'side-date', row.date));
      item.appendChild(text);
      sideList.appendChild(item);
    });
  }

  // ---------- run ----------
  if (!core || !core.ready) { showMessage(NOT_PUBLISHED); return; }   // sheet not connected yet

  (async function () {
    let rows;
    try {
      rows = await core.load('Blogs', 'slot');
    } catch (err) {
      console.warn('[sheet] "Blogs" not loaded.', err);
      showMessage(COULD_NOT_LOAD);
      return;
    }

    const posts = rows.filter(r => r.title && slotOf(r) && isPublished(r));
    const mine = posts.find(r => slotOf(r) === slot);
    if (!mine) { showMessage(NOT_PUBLISHED); return; }

    renderPost(mine);
    renderSide(posts.filter(r => slotOf(r) !== slot)
                    .sort((a, b) => slotOf(a).localeCompare(slotOf(b))));
  })();
})();
