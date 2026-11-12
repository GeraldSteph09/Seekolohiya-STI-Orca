// =========================================================
// sheet-members.js — fills members.html from the Google Sheet.
// Every section starts hidden; it only appears if the sheet has data.
//   Executives tab -> officer cards          (+ Pictures: executives-group)
//   Directors tab  -> Director/Co-Director pairs, grouped by committee
//   Committees tab -> committee group photos (uses the "photo" column)
//   Settings tab   -> intro line (members_lead)
// =========================================================
(function () {
  const core = window.SheetsCore, page = window.SheetsPage;
  const $ = id => document.getElementById(id);
  const note = $('emptyNote');

  if (!core || !core.ready || !page) {
    if (note) { note.textContent = 'No members have been posted yet. Check back soon!'; note.hidden = false; }
    return;
  }

  // intro line (only shows if the sheet has text for it)
  core.run('Settings', async () => {
    const s = await core.settings();
    if (s.members_lead) { $('membersLead').textContent = s.members_lead; $('membersLead').hidden = false; }
  });

  page.start([
    ['Executives', executives],
    ['Directors', directors],
    ['Committees', committeePhotos],
  ], {
    note,
    emptyText: 'No members have been posted yet. Check back soon!',
    errorText: "We couldn't load this page right now. Please refresh in a moment.",
  });

  // ---------------- EXECUTIVES ----------------
  async function executives() {
    const [people, pics] = await Promise.all([
      core.load('Executives', 'position').then(rows => rows.filter(r => r.position)),
      core.load('Pictures', 'slot').catch(() => []),
    ]);
    const grid = $('executivesGrid');
    grid.textContent = '';
    people.forEach(r => grid.appendChild(memberCard(r.position, r.name, r.photo)));

    // the group photo under the cards
    const row = pics.find(r => r.slot.toLowerCase() === 'executives-group');
    const img = row ? await page.loadImage(core.image(row.image), row.alt || 'Executives group photo') : null;
    if (img) {
      const box = $('executivesPhotoWrap').querySelector('.executive-photo');
      box.textContent = '';
      box.appendChild(img);
      $('executivesPhotoWrap').hidden = false;
    }

    const any = people.length > 0 || !!img;
    $('executivesSection').hidden = !any;
    return any;
  }

  // ---------------- DIRECTORS ----------------
  async function directors() {
    const rows = (await core.load('Directors', 'committee')).filter(r => r.committee);
    const grid = $('directorsGrid');
    grid.textContent = '';

    const groups = new Map();                   // group by committee, keep sheet order
    rows.forEach(r => {
      if (!groups.has(r.committee)) groups.set(r.committee, []);
      groups.get(r.committee).push(r);
    });
    groups.forEach((people, committee) => {
      const pair = core.make('div', 'director-pair');
      pair.appendChild(core.make('p', 'pair-label', committee));
      const cards = core.make('div', 'pair-cards');
      people.forEach(r => cards.appendChild(
        memberCard((committee + ' ' + (r.role || '')).trim(), r.name, r.photo)));
      pair.appendChild(cards);
      grid.appendChild(pair);
    });

    $('directorsSection').hidden = !rows.length;
    return rows.length > 0;
  }

  // ---------------- COMMITTEE GROUP PHOTOS ----------------
  async function committeePhotos() {
    const rows = (await core.load('Committees', 'committee')).filter(r => r.committee && core.image(r.photo));
    const loaded = await Promise.all(rows.map(r =>
      page.loadImage(core.image(r.photo), r.committee + ' committee group photo')));
    const grid = $('committeesGrid');
    grid.textContent = '';

    rows.forEach((r, i) => {
      if (!loaded[i]) return;                   // missing picture -> skip that committee
      const card = core.make('div', 'committee-card');
      const photo = core.make('div', 'committee-photo group-photo');
      photo.tabIndex = 0;
      photo.setAttribute('role', 'button');
      photo.setAttribute('aria-label', 'Click to view ' + r.committee + ' committee group photo larger');
      photo.appendChild(loaded[i]);
      card.append(photo, core.make('h3', '', r.committee));
      grid.appendChild(card);
    });

    const any = grid.children.length > 0;
    $('committeesSection').hidden = !any;
    return any;
  }

  // one person card: round photo + position + name
  function memberCard(position, name, photo) {
    const card = core.make('div', 'member-card');
    const avatar = core.make('div', 'avatar');
    core.showImage(avatar, core.image(photo), position, () => { avatar.textContent = 'Photo'; });
    card.append(avatar, core.make('h3', '', position), core.make('span', '', name));
    return card;
  }
})();
