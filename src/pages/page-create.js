/* ============================================================
   page-create.js — Création
   Gauche : éditeur Markdown + éditeur CSS (empilés, ½ hauteur chacun)
   Droite : WYSIWYG (rendu live de la slide courante)
   ============================================================ */
import { getDecks, getDeck, saveDeck, newDeck } from '../store.js';
import { splitSlides, renderSlideInto, applyDeckCss } from '../md2slides.js';

export function mount(app) {
  const params = new URLSearchParams(location.search);
  const decks = getDecks();
  const deck = getDeck(params.get('id')) || getDeck(params.get('last')) || decks[0] || newDeck();

  app.innerHTML = `
    <div class="create-page">
      <div class="editors">
        <section class="editor">
          <h3>📝 Markdown <button id="btn-sep" class="mini" title="Insérer un séparateur de slide">+ slide</button></h3>
          <textarea id="ed-md" spellcheck="false"></textarea>
        </section>
        <section class="editor">
          <h3>🎨 CSS du deck</h3>
          <textarea id="ed-css" spellcheck="false"></textarea>
        </section>
      </div>
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
        <div class="preview-stage">
          <section class="slide" id="p-slide"></section>
        </div>
      </section>
    </div>`;

  const edMd = app.querySelector('#ed-md');
  const edCss = app.querySelector('#ed-css');
  const slideEl = app.querySelector('#p-slide');
  const counter = app.querySelector('#p-counter');
  const deckSel = app.querySelector('#deck-sel');
  const stage = app.querySelector('.preview-stage');

  let slides = [];
  let idx = 0;
  let dirty = false;

  /* ---- sélecteur de deck ---- */
  const refreshSel = () => {
    deckSel.innerHTML = getDecks().map((d) => `<option value="${d.id}" ${d.id === deck.id ? 'selected' : ''}>${d.name}</option>`).join('');
  };
  refreshSel();
  deckSel.addEventListener('change', () => {
    if (dirty && !confirm('Modifications non enregistrées. Changer de deck ?')) { refreshSel(); return; }
    location.search = '?id=' + deckSel.value;
    location.hash = '#/create';
  });

  /* ---- état ---- */
  edMd.value = deck.md;
  edCss.value = deck.css;

  const update = () => {
    slides = splitSlides(edMd.value);
    idx = Math.min(idx, Math.max(0, slides.length - 1));
    if (slides.length) renderSlideInto(slideEl, slides[idx]);
    else slideEl.innerHTML = '<p class="error">Deck vide — ajoutez du contenu Markdown.</p>';
    counter.textContent = `${slides.length ? idx + 1 : 0} / ${slides.length}`;
    applyDeckCss(stage, edCss.value);
    dirty = true;
  };

  edMd.addEventListener('input', update);
  edCss.addEventListener('input', update);
  app.querySelector('#btn-prev').addEventListener('click', () => { idx = Math.max(0, idx - 1); update(); dirty = true; });
  app.querySelector('#btn-next').addEventListener('click', () => { idx = Math.min(slides.length - 1, idx + 1); update(); dirty = true; });

  /* ---- insertion d'un séparateur de slide au curseur ---- */
  app.querySelector('#btn-sep').addEventListener('click', () => {
    const p = edMd.selectionStart;
    const before = edMd.value.slice(0, p);
    const after = edMd.value.slice(p);
    edMd.value = before.replace(/\s*$/, '') + '\n\n---\n\n' + after.replace(/^\s*/, '');
    edMd.selectionStart = edMd.selectionEnd = p + 7;
    edMd.focus();
    update();
  });

  /* ---- actions ---- */
  app.querySelector('#btn-save').addEventListener('click', () => {
    deck.name = deckSel.value === deck.id ? deck.name : deck.name;
    saveDeck({ ...deck, md: edMd.value, css: edCss.value });
    dirty = false;
    const b = app.querySelector('#btn-save');
    b.textContent = '✓ Enregistré';
    setTimeout(() => (b.textContent = '💾 Enregistrer'), 1200);
  });

  app.querySelector('#btn-new').addEventListener('click', () => {
    const name = prompt('Nom du nouveau deck :');
    if (!name) return;
    const d = newDeck(name);
    location.search = '?id=' + d.id;
    location.hash = '#/create';
  });

  /* navigation clavier dans l'aperçu uniquement quand le focus n'est pas dans un éditeur */
  const key = (e) => {
    if (document.activeElement === edMd || document.activeElement === edCss) return;
    if (e.key === 'ArrowLeft') { idx = Math.max(0, idx - 1); update(); }
    if (e.key === 'ArrowRight') { idx = Math.min(slides.length - 1, idx + 1); update(); }
  };
  document.addEventListener('keydown', key);

  update();
  return () => document.removeEventListener('keydown', key);
}
