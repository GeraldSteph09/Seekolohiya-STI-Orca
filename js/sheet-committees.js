// =========================================================
// sheet-committees.js — fills committees.html from the Google Sheet.
//   Committees tab -> one card per row (icon, description, roles)
//   Settings tab   -> intro line (committees_lead)
// With no rows, the cards simply don't appear.
// =========================================================
(function () {
  const core = window.SheetsCore, page = window.SheetsPage;
  const $ = id => document.getElementById(id);
  const note = $('emptyNote');

  if (!core || !core.ready || !page) {
    if (note) { note.textContent = 'No committees have been posted yet. Check back soon!'; note.hidden = false; }
    return;
  }

  core.run('Settings', async () => {
    const s = await core.settings();
    if (s.committees_lead) { $('committeesLead').textContent = s.committees_lead; $('committeesLead').hidden = false; }
  });

  page.start([
    ['Committees', async () => {
      const rows = (await core.load('Committees', 'committee')).filter(r => r.committee);
      const grid = $('committeesGrid');
      grid.textContent = '';

      rows.forEach(r => {
        // the class (e.g. "creatives") picks that committee's accent color in committees.css
        const card = core.make('article', 'committee-card ' + core.slug(r.committee));
        if (/^#[0-9a-f]{3,8}$/i.test(r.color || '')) card.style.setProperty('--accent', r.color);

        if (r.icon) {
          const icon = core.make('span', 'icon-circle', r.icon);
          icon.setAttribute('aria-hidden', 'true');
          card.appendChild(icon);
        }
        const title = /committee$/i.test(r.committee) ? r.committee : r.committee + ' Committee';
        card.appendChild(core.make('h2', '', title));
        if (r.description) card.appendChild(core.make('p', '', r.description));

        const roles = (r.roles || '').split(',').map(x => x.trim()).filter(Boolean);
        if (roles.length) {
          const chips = core.make('div', 'role-chips');
          roles.forEach(role => chips.appendChild(core.make('span', '', role)));
          card.appendChild(chips);
        }
        grid.appendChild(card);
      });

      grid.hidden = !rows.length;
      return rows.length > 0;
    }],
  ], {
    note,
    emptyText: 'No committees have been posted yet. Check back soon!',
    errorText: "We couldn't load this page right now. Please refresh in a moment.",
  });
})();
