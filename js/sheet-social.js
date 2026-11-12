// =========================================================
// sheet-social.js — fills social.html from the Google Sheet
//   Social tab   -> one card per row (name, link, label, icon)
//   Settings tab -> the intro line ("social_lead")
// =========================================================
(function () {
  const core = window.SheetsCore;
  if (!core || !core.ready) return;

  core.run('Settings', async () => {
    const s = await core.settings();
    core.setText('.page > p.lead', s.social_lead);
  });

  core.run('Social', async () => {
    const rows = (await core.load('Social', 'name')).filter(r => r.name && core.link(r.link));
    const grid = document.querySelector('.social-grid');
    if (!grid || !rows.length) return;          // empty tab = keep the HTML
    grid.textContent = '';

    rows.forEach(r => {
      const card = core.make('a', 'social-card ' + core.slug(r.name));
      card.href = core.link(r.link);
      if (/^https?:/i.test(card.href)) { card.target = '_blank'; card.rel = 'noopener'; }

      const iconSrc = core.image(r.icon);
      if (iconSrc) {
        const circle = core.make('span', 'icon-circle');
        circle.setAttribute('aria-hidden', 'true');
        card.appendChild(circle);
        // if the icon file can't be found, drop the empty circle instead of showing a broken picture
        core.showImage(circle, iconSrc, '', () => circle.remove());
      }
      card.appendChild(core.make('h2', '', r.name));
      if (r.label) card.appendChild(core.make('span', '', r.label));
      grid.appendChild(card);
    });
  });
})();
