/* ============================================================
   page-view.js — Visualisation (plein écran, navigation, impression)
   ============================================================ */
import { getDecks, getDeck, getSettings } from '../store.js';
import { splitSlides, renderSlideInto, applyDeckCss, md2html } from '../md2slides.js';

export function mount(app) {
  const params = new URLSearchParams(location.search);
  const decks = getDecks();

  if (!decks.length) {
    app.innerHTML = '<div class="empty">Aucun deck. <a href="#/create">Créez votre première présentation →</a></div>';
    return;
  }

  const deck = getDeck(params.get('id')) || getDeck(getSettings().lastDeck) || decks[0];
  const slides = splitSlides(deck.md);

  if (!slides.length) {
    app.innerHTML = `<div class="empty">Le deck « ${deck.name} » est vide. <a href="#/create?id=${deck.id}">L'éditer →</a></div>`;
    return;
  }

  app.innerHTML = `
    <div class="view-page">
      <div class="view-stage" id="stage">
        <section class="slide" id="v-slide"></section>
      </div>
      <div class="view-progress" id="progress"></div>
      <nav class="view-hud" id="hud">
        <select id="deck-sel" title="Deck"></select>
        <button id="btn-prev" title="Précédente (←)">←</button>
        <span id="v-counter">– / –</span>
        <button id="btn-next" title="Suivante (→)">→</button>
        <button id="btn-overview" title="Vue d'ensemble (O)">▦</button>
        <button id="btn-full" title="Plein écran (F)">⛶</button>
      </nav>
      <section class="view-overview hidden" id="overview"></section>
    </div>`;

  applyDeckCss(app, deck.css);

  const slideEl = app.querySelector('#v-slide');
  const counter = app.querySelector('#v-counter');
  const progress = app.querySelector('#progress');
  const stage = app.querySelector('#stage');
  const overview = app.querySelector('#overview');
  const deckSel = app.querySelector('#deck-sel');

  deckSel.innerHTML = decks.map((d) => `<option value="${d.id}" ${d.id === deck.id ? 'selected' : ''}>${d.name}</option>`).join('');
  deckSel.addEventListener('change', () => { location.search = '?id=' + deckSel.value; });

  let idx = 0;

  const update = () => {
    renderSlideInto(slideEl, slides[idx]);
    counter.textContent = `${idx + 1} / ${slides.length}`;
    progress.style.width = ((idx + 1) / slides.length) * 100 + '%';
    history.replaceState(null, '', location.pathname + location.search + '#' + (idx + 1));
  };

  const goTo = (i) => { idx = Math.max(0, Math.min(slides.length - 1, i)); update(); };

  /* ---- vue d'ensemble ---- */
  const buildOverview = () => {
    overview.innerHTML = '';
    slides.forEach((md, i) => {
      const t = document.createElement('div');
      t.className = 'thumb' + (i === idx ? ' active' : '');
      const inner = document.createElement('div');
      inner.className = 'thumb-content';
      inner.innerHTML = md2html(md);
      t.appendChild(inner);
      t.addEventListener('click', () => { toggleOverview(false); goTo(i); });
      overview.appendChild(t);
    });
  };
  const toggleOverview = (force) => {
    const show = force !== undefined ? force : overview.classList.contains('hidden');
    overview.classList.toggle('hidden', !show);
    if (show) buildOverview();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  /* ---- impression : une slide par page ---- */
  const beforePrint = () => {
    const wrap = document.createElement('div');
    wrap.id = 'print-deck';
    slides.forEach((md) => {
      const s = document.createElement('section');
      s.className = 'slide';
      s.innerHTML = md2html(md);
      wrap.appendChild(s);
    });
    app.appendChild(wrap);
  };
  const afterPrint = () => app.querySelector('#print-deck')?.remove();
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);

  /* ---- clavier / clic / tactile ---- */
  const key = (e) => {
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); goTo(idx + 1); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); goTo(idx - 1); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(slides.length - 1); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'o': case 'O': toggleOverview(); break;
      case 'Escape': toggleOverview(false); break;
    }
  };
  const click = (e) => {
    const r = stage.getBoundingClientRect();
    (e.clientX - r.left < r.width / 2 ? () => goTo(idx - 1) : () => goTo(idx + 1))();
  };
  let touchX = null;
  const tStart = (e) => { touchX = e.touches[0].clientX; };
  const tEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? idx + 1 : idx - 1);
    touchX = null;
  };

  document.addEventListener('keydown', key);
  stage.addEventListener('click', click);
  document.addEventListener('touchstart', tStart, { passive: true });
  document.addEventListener('touchend', tEnd, { passive: true });
  app.querySelector('#btn-prev').addEventListener('click', (e) => { e.stopPropagation(); goTo(idx - 1); });
  app.querySelector('#btn-next').addEventListener('click', (e) => { e.stopPropagation(); goTo(idx + 1); });
  app.querySelector('#btn-overview').addEventListener('click', () => toggleOverview());
  app.querySelector('#btn-full').addEventListener('click', toggleFullscreen);

  const start = parseInt(location.hash.slice(1), 10);
  goTo(Number.isInteger(start) && start >= 1 && start <= slides.length ? start - 1 : 0);

  return () => {
    document.removeEventListener('keydown', key);
    document.removeEventListener('touchstart', tStart);
    document.removeEventListener('touchend', tEnd);
    window.removeEventListener('beforeprint', beforePrint);
    window.removeEventListener('afterprint', afterPrint);
  };
}
