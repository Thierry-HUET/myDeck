/* ============================================================
   myDeck — moteur d'affichage des slides
   deck.md : slides séparées par une ligne « --- »
   style.css : thème
   ============================================================ */
(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const deckPath = params.get('deck') || 'deck.md';

  const slideEl = document.getElementById('slide');
  const counterEl = document.getElementById('counter');
  const progressEl = document.getElementById('progress');
  const overviewEl = document.getElementById('overview');

  let slides = [];
  let index = 0;

  /* ---------- Markdown ---------- */

  const md2html = (md) =>
    typeof marked !== 'undefined'
      ? marked.parse(md)
      : md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');

  function splitSlides(md) {
    return md
      .split(/(?:\r?\n|^)[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*(?=\r?\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /* ---------- Rendu ---------- */

  function renderSlide(target, md) {
    target.innerHTML = md2html(md);
    // Slide de titre : commence par un « # »
    target.classList.toggle('title-slide', /^#\s/m.test(md));
  }

  function update() {
    renderSlide(slideEl, slides[index]);
    counterEl.textContent = (index + 1) + ' / ' + slides.length;
    progressEl.style.width = ((index + 1) / slides.length) * 100 + '%';
    history.replaceState(null, '', '#' + (index + 1));
  }

  function goTo(i) {
    if (!slides.length) return;
    index = Math.max(0, Math.min(slides.length - 1, i));
    update();
  }
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  /* ---------- Vue d'ensemble ---------- */

  function buildOverview() {
    overviewEl.innerHTML = '';
    slides.forEach((md, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb' + (i === index ? ' active' : '');
      thumb.title = 'Slide ' + (i + 1);
      const inner = document.createElement('div');
      inner.className = 'thumb-content';
      inner.innerHTML = md2html(md);
      thumb.appendChild(inner);
      thumb.addEventListener('click', () => {
        toggleOverview(false);
        goTo(i);
      });
      overviewEl.appendChild(thumb);
    });
  }

  function toggleOverview(force) {
    const show = force !== undefined ? force : overviewEl.classList.contains('hidden');
    overviewEl.classList.toggle('hidden', !show);
    if (show) buildOverview();
  }

  /* ---------- Plein écran ---------- */

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  /* ---------- Impression : une slide par page ---------- */

  window.addEventListener('beforeprint', () => {
    const wrap = document.createElement('div');
    wrap.id = 'print-deck';
    slides.forEach((md) => {
      const s = document.createElement('section');
      s.className = 'slide';
      s.innerHTML = md2html(md);
      wrap.appendChild(s);
    });
    document.body.appendChild(wrap);
  });

  window.addEventListener('afterprint', () => {
    document.getElementById('print-deck')?.remove();
  });

  /* ---------- Navigation ---------- */

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(slides.length - 1); break;
      case 'f':
      case 'F': toggleFullscreen(); break;
      case 'o':
      case 'O': toggleOverview(); break;
      case 'Escape': toggleOverview(false); break;
    }
  });

  // Clic : moitié gauche = précédent, moitié droite = suivant (style télécommande)
  document.getElementById('stage').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    (e.clientX - rect.left < rect.width / 2 ? prev : next)();
  });

  // Swipe tactile
  let touchX = null;
  document.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    touchX = null;
  }, { passive: true });

  document.getElementById('btn-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  document.getElementById('btn-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
  document.getElementById('btn-full').addEventListener('click', toggleFullscreen);
  document.getElementById('btn-overview').addEventListener('click', () => toggleOverview());

  /* ---------- Chargement ---------- */

  async function init() {
    try {
      const res = await fetch(deckPath);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      slides = splitSlides(await res.text());
    } catch {
      slideEl.innerHTML =
        '<p class="error">Impossible de charger « ' + deckPath + ' ».<br>' +
        'Lancez un serveur HTTP local (ex. <code>python3 -m http.server</code>) ' +
        'ou l\'extension VS Code « Live Server ».</p>';
      return;
    }
    if (!slides.length) {
      slideEl.innerHTML = '<p class="error">Le deck est vide.</p>';
      return;
    }
    const start = parseInt(location.hash.slice(1), 10);
    goTo(Number.isInteger(start) && start >= 1 && start <= slides.length ? start - 1 : 0);
  }

  init();
})();
