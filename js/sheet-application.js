// =========================================================
// sheet-application.js — fills application.html from the Google Sheet.
//   Settings tab:
//     application_show    yes / no   (blank = yes)  -> open or close applications
//     application_link    the form link
//     application_lead    the line under the page title
//     application_note    the small note inside the box
//     application_closed  (optional) message shown while applications are closed
//
// Applications are shown only when application_show is not "no" AND a link exists.
// =========================================================
(function () {
  const core = window.SheetsCore, page = window.SheetsPage;
  const $ = id => document.getElementById(id);
  const note = $('emptyNote');
  const CLOSED = "Applications aren't open right now. Check back soon!";

  if (!core || !core.ready || !page) {
    if (note) { note.textContent = CLOSED; note.hidden = false; }
    return;
  }

  // "show" works like the blogs: it is closed only if it says no / false / hide / closed / draft / 0
  const isOpen = value => !/^(no|false|hide|hidden|closed|draft|0)$/i.test((value || '').trim());

  // the closed message can be customised in the sheet (falls back to the default)
  const closedText = core.settings().then(s => s.application_closed || CLOSED).catch(() => CLOSED);

  closedText.then(text => page.start([
    ['Settings', async () => {
      const s = await core.settings();
      const url = core.link(s.application_link);
      if (!isOpen(s.application_show) || !url) return false;    // closed: nothing shows except the note

      if (s.application_lead) { $('applicationLead').textContent = s.application_lead; $('applicationLead').hidden = false; }
      $('applicationButton').href = url;
      const text = $('applicationNote');
      text.textContent = s.application_note || '';
      text.hidden = !s.application_note;
      $('applicationPanel').hidden = false;
      return true;
    }],
  ], {
    note,
    emptyText: text,
    errorText: "We couldn't load this page right now. Please refresh in a moment.",
  }));
})();
