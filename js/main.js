// main.js — shared behavior across every page

document.addEventListener('DOMContentLoaded', () => {
  // Fill in the current year in the footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Highlight whichever nav pill matches the current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav .nav-pill').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('is-active');
  });

  // ---- Lightbox: click any ".group-photo" to expand its image ----
  // Uses "event delegation" (one listener on the whole page) so it also
  // works for photos that the Google Sheet adds after the page loads.
  const lightbox = document.getElementById('photoLightbox');
  if (lightbox) {
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    const openLightbox = (img) => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    document.addEventListener('click', (e) => {
      const box = e.target.closest('.group-photo');
      if (!box) return;
      const img = box.querySelector('img');
      if (img) openLightbox(img);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
      if ((e.key === 'Enter' || e.key === ' ') &&
          e.target.classList && e.target.classList.contains('group-photo')) {
        const img = e.target.querySelector('img');
        if (img) { e.preventDefault(); openLightbox(img); }
      }
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
});
