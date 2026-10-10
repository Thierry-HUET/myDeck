/* ============================================================
   page-create.js — Création
   Layout défini dans les Paramètres (settings.layout.mode) :
   • horizontal : [ éditeurs MD/CSS empilés | WYSIWYG ]  (défaut)
   • vertical   : [ WYSIWYG / éditeurs MD|CSS côte à côte ]
   Tous les containers sont redimensionnables par splitters.
   ============================================================ */
import { getDecks, getDeck, getSettings, saveSettings, saveDeck as storeDeck, newDeck } from '../store.js';
import { splitSlides, renderSlideInto, applyDeckCss } from '../md2slides.js';
import { applyDeckImages, saveDeck as mdkSave, getLinkedFileName } from '../deckfs.js';

const DEFAULT_LAYOUT = { mode: 'horizontal', main: 50, sub: 50 };

export function mount(app) {
  const params = new URLSearchParams(location.search);
  const decks = getDecks();
  const deck = getDeck(params.get('id')) || getDeck(getSettings().lastDeck) || decks[0] || newDeck();
  const layout = { ...DEFAULT_LAYOUT, ...(getSettings().layout || {}) };

  app.innerHTML = `
    <div class="create-page mode-${layout.mode}" id="cp">
      <div class="editors" id="editors">
        <section class="editor">
          <h3>📝 Markdown <button id="btn-sep" class="mini" title="Insérer un séparateur de slide">+ slide</button></h3>
          <textarea id="ed-md" spellcheck="false"></textarea>
        </section>
        <div class="splitter sub-split" data-split="sub" title="Glisser pour redimensionner"><span></span></div>
        <section class="editor">
          <h3>🎨 CSS du deck</h3>
          <textarea id="ed-css" spellcheck="false"></textarea>
        </section>
      </div>
      <div class="splitter main-split" data-split="main" title="Glisser pour redimensionner"><span></span></div>
      <section class="preview">
        <div class="preview-bar">
          <select id="deck-sel" title="Deck courant"></select>
          <button id="btn-prev">←</button>
          <span id="p-counter">– / –</span>
          <button id="btn-next">→</button>
          <span class="spacer"></span>
          <button id="btn-new">+ Nouveau</button>
          <button id="btn-save" class="primary">💾 Enregistrer</button>
        </div>
        <div class="preview-stage" id="p-stage">
          <section class="slide" id="p-slide"></section>
        </div>
      </section>
    </div>`;

  const page = app.querySelector('#cp');
  const editors = app.querySelector('#editors');
  const edMd = app.querySelector('#ed-md');
  const edCss = app.querySelector('#ed-css');
  const slideEl = app.querySelector('#p-slide');
  const stage = app.querySelector('#p-stage');
  const counter = app.querySelector('#p-counter');
  const deckSel = app.querySelector('#deck-sel');

  let slides = [];
  let idx = 0;
  let dirty = false;

  /* ================= Layout (mode issu des Paramètres) ================= */

  const clamp = (v) => Math.max(15, Math.min(85, v));

  function applyLayout() {
    page.classList.toggle('mode-horizontal', layout.mode === 'horizontal');
    page.classList.toggle('mode-vertical', layout.mode === 'vertical');
    page.style.setProperty('--main', layout.main + '%');
    editors.style.setProperty('--sub', layout.sub + '%');
  }

  const persistLayout = () => saveSettings({ ...getSettings(), layout: { ...layout } });

  /* ---- splitters (pointer events + capture) ---- */

  for (const sp of app.querySelectorAll('.splitter')) {
    sp.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sp.setPointerCapture(e.pointerId);
      const vertical = sp.dataset.split === 'main'
        ? layout.mode === 'vertical'      // axe du splitter principal
        : layout.mode === 'horizontal';   // axe du splitter interne (inverse)
      const target = sp.dataset.split === 'main' ? page : editors;
      const move = (ev) => {
        const r = target.getBoundingClientRect();
        const pct = vertical
          ? ((ev.clientY - r.top) / r.height) * 100
          : ((ev.clientX - r.left) / r.width) * 100;
        const key = sp.dataset.split;
        layout[key] = clamp(pct);
        if (key === 'main') page.style.setProperty('--main', layout.main + '%');
        else editors.style.setProperty('--sub', layout.sub + '%');
      };
      const up = () => {
        sp.removeEventListener('pointermove', move);
        sp.removeEventListener('pointerup', up);
        sp.removeEventListener('pointercancel', up);
        persistLayout();
      };
      sp.addEventListener('pointermove', move);
      sp.addEventListener('pointerup', up);
      sp.addEventListener('pointercancel', up);
    });
  }

  applyLayout();

  /* ================= Decks ================= */

  const refreshSel = () => {
    deckSel.innerHTML = getDecks().map((d) => `<option value="${d.id}" ${d.id === deck.id ? 'selected' : ''}>${d.name}</option>`).join('');
  };
  refreshSel();
  deckSel.addEventListener('change', () => {
    if (dirty && !confirm('Modifications non enregistrées. Changer de deck ?')) { refreshSel(); return; }
    location.search = '?id=' + deckSel.value;
    location.hash = '#/create';
  });

  edMd.value = deck.md;
  edCss.value = deck.css;

  const update = () => {
    slides = splitSlides(edMd.value);
    idx = Math.min(idx, Math.max(0, slides.length - 1));
    if (slides.length) { renderSlideInto(slideEl, slides[idx]); applyDeckImages(slideEl); }
    else slideEl.innerHTML = '<p class="error">Deck vide — ajoutez du contenu Markdown.</p>';
    counter.textContent = `${slides.length ? idx + 1 : 0} / ${slides.length}`;
    applyDeckCss(stage, edCss.value);
    dirty = true;
  };

  edMd.addEventListener('input', update);
  edCss.addEventListener('input', update);
  app.querySelector('#btn-prev').addEventListener('click', () => { idx = Math.max(0, idx - 1); update(); dirty = true; });
  app.querySelector('#btn-next').addEventListener('click', () => { idx = Math.min(slides.length - 1, idx + 1); update(); dirty = true; });

  app.querySelector('#btn-sep').addEventListener('click', () => {
    const p = edMd.selectionStart;
    const before = edMd.value.slice(0, p);
    const after = edMd.value.slice(p);
    edMd.value = before.replace(/\s*$/, '') + '\n\n---\n\n' + after.replace(/^\s*/, '');
    edMd.selectionStart = edMd.selectionEnd = p + 7;
    edMd.focus();
    update();
  });

  /* Fichier .mdk lié au deck courant — affiché dans le titre du bouton */
  const saveBtn = app.querySelector('#btn-save');
  const refreshLinked = async () => {
    const f = await getLinkedFileName(deck.id);
    saveBtn.title = f ? `Enregistrer — fichier lié : ${f}` : 'Enregistrer — aucun fichier .mdk lié (le sélecteur s\'ouvrira)';
  };
  refreshLinked();

  saveBtn.addEventListener('click', async () => {
    const current = { ...deck, md: edMd.value, css: edCss.value };
    storeDeck(current);            // 1) cache navigateur
    const b = app.querySelector('#btn-save');
    b.disabled = true;
    b.textContent = '… Enregistrement';
    let msg = '✓ Enregistré (cache)';
    try {
      const r = await mdkSave(current);   // restaure l'emplacement en cours (IndexedDB) si besoin
      if (r && !r.cancelled) {
        if (r.where === 'handle') msg = `✓ ${r.filename}`;
        else if (r.where === 'download') msg = '✓ .mdk téléchargé';
        else msg = `✓ ${r.filename}`;
        /* Raison pour laquelle l'explorateur a été ouvert (diagnostic) */
        if (r.reason && r.reason !== 'aucun-fichier-lié') {
          alert(`Sélecteur ouvert : ${r.reason}.`);
        }
      }
      refreshLinked();
    } catch (e) {
      if (e && e.name !== 'AbortError') { alert('Enregistrement .mdk impossible : ' + e.message); }
    }
    dirty = false;
    b.textContent = msg;
    setTimeout(() => { b.textContent = '💾 Enregistrer'; b.disabled = false; }, 1200);
  });

  app.querySelector('#btn-new').addEventListener('click', () => {
    const name = prompt('Nom du nouveau deck :');
    if (!name) return;
    const d = newDeck(name);
    location.search = '?id=' + d.id;
    location.hash = '#/create';
  });

  /* navigation clavier inactive quand le focus est dans un éditeur */
  const key = (e) => {
    if (document.activeElement === edMd || document.activeElement === edCss) return;
    if (e.key === 'ArrowLeft') { idx = Math.max(0, idx - 1); update(); }
    if (e.key === 'ArrowRight') { idx = Math.min(slides.length - 1, idx + 1); update(); }
  };
  document.addEventListener('keydown', key);

  update();
  return () => document.removeEventListener('keydown', key);
}
