// =========================================================
// sheets-core.js — shared by every page that reads the Google Sheet
//
// This file does the "talking to Google" part. Each page has its
// own small file (sheet-home.js, sheet-members.js ...) that uses
// these helpers to fill in that page.
//
// Load it BEFORE the page's own sheet file.
// =========================================================
(function () {

  // ================= EDIT THIS PART (only place!) =================
  // The long code in your sheet's address bar:
  //   docs.google.com/spreadsheets/d/  THIS-PART  /edit
  const SHEET_ID = '1i_jQtHeYbOkXaaN64t5_WnTtjIebKHsGygn74NJ0OLQ';
  // ================================================================

  const ready = !!SHEET_ID && !SHEET_ID.startsWith('PASTE_');

  // ---------- Get one tab from Google as CSV text ----------
  function tabUrl(tab) {
    return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
           '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(tab);
  }

  async function fetchRows(tab) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);      // give up after 8s
    try {
      const res = await fetch(tabUrl(tab), { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('Google answered ' + res.status);
      return parseCSV(await res.text());
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- CSV text -> rows of cells (handles commas/quotes/line breaks in a cell) ----------
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], cell = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else inQuotes = false;
        } else cell += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell); cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // ---------- rows -> objects like { title:'..', description:'..' } ----------
  // Throws if the heading isn't found (wrong tab name, sheet not shared,
  // or Google sent a login page instead of data).
  function rowsToObjects(rows, requiredHeader) {
    const headerAt = rows.slice(0, 3).findIndex(r =>
      r.some(c => c.trim().toLowerCase() === requiredHeader));
    if (headerAt === -1) {
      throw new Error('Column "' + requiredHeader + '" not found. Check the tab name and the headings in row 1.');
    }
    const keys = rows[headerAt].map(c => c.trim().toLowerCase());
    return rows
      .slice(headerAt + 1)
      .filter(r => r.some(c => c.trim() !== ''))
      .map(r => {
        const obj = {};
        keys.forEach((k, i) => { obj[k] = (r[i] || '').trim(); });
        return obj;
      });
  }

  // Load one tab as a list of objects.
  function load(tab, requiredHeader) {
    return fetchRows(tab).then(rows => rowsToObjects(rows, requiredHeader));
  }

  // The "Settings" tab as { key: value }. Fetched once, then reused.
  let settingsPromise = null;
  function settings() {
    if (!settingsPromise) {
      settingsPromise = load('Settings', 'key').then(rows => {
        const out = {};
        rows.forEach(r => { if (r.key) out[r.key.toLowerCase()] = r.value || ''; });
        return out;
      });
    }
    return settingsPromise;
  }

  // ---------- Pictures ----------
  // Accepts a Google Drive share link, any https:// image link, or a plain
  // file name that lives in your /images folder (e.g. members/president.jpg).
  function image(value) {
    const v = (value || '').trim();
    if (!v) return '';
    const drive = v.match(/drive\.google\.com\/(?:file\/d\/([\w-]+)|(?:open|uc)\?(?:[^#]*&)?id=([\w-]+))/);
    if (drive) return 'https://drive.google.com/thumbnail?id=' + (drive[1] || drive[2]) + '&sz=w1000';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w\-./ ]+$/.test(v) && !v.includes('..')) return 'images/' + v.replace(/^\/+/, '');
    return '';
  }

  // Only normal web links or email links are allowed.
  function link(value) {
    const v = (value || '').trim();
    return /^(https?:\/\/|mailto:)/i.test(v) ? v : '';
  }

  // ---------- Small helpers for building page parts safely ----------
  // (textContent never runs as code, so nothing typed in the sheet can break the page)
  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el && text) el.textContent = text;
  }

  // Put a picture inside a box. If it can't load, run onFail (e.g. show "Photo").
  function showImage(box, src, alt, onFail) {
    box.textContent = '';
    if (!src) { if (onFail) onFail(); return; }
    const img = new Image();
    img.alt = alt || '';
    img.onerror = () => { img.remove(); if (onFail) onFail(); };
    img.src = src;
    box.appendChild(img);
  }

  function slug(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // Run one section; if anything goes wrong, leave the page's own HTML as it is.
  async function run(label, fn) {
    try { await fn(); }
    catch (err) { console.warn('[sheet] "' + label + '" not loaded; keeping the page as written in the HTML.', err); }
  }

  window.SheetsCore = { ready, load, settings, image, link, make, setText, showImage, slug, run };

})();
