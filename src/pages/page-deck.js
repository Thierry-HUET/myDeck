/* ============================================================
   page-deck.js — menu Deck
   Nouveau · Ouvrir (.mdk) · Enregistrer · Enregistrer sous ·
   Exporter (.zip) ──────────── · Paramètres
   Cache de travail : navigateur (localStorage).
   Fichier disque : <nom du deck>.mdk (archive ZIP du projet).
   ============================================================ */
import { getDecks, getDeck, getSettings, saveDeck as storeDeck, newDeck } from '../store.js';
import * as deckfs from '../deckfs.js';

/* Icônes flat sobres (trait 2px, currentColor) */
const ICONS = {
  nouveau: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  ouvrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  enregistrer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  saveas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/><path d="m10 15 4 4"/><path d="m14 15-4 4"/></svg>',
  exporter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
  parametres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M2 14h4M10 8h4M18 16h4"/></svg>',
};

export function mount(app) {
  app.innerHTML = `
    <div class="deck-page">
      <h2>Deck</h2>
      <p id="d-status" class="deck-status"></p>

      <section class="card">
        <div class="deck-menu">
          <button id="d-new">${ICONS.nouveau}Nouveau deck</button>
          <button id="d-open">${ICONS.ouvrir}Ouvrir (.mdk)…</button>
          <button id="d-save">${ICONS.enregistrer}Enregistrer</button>
          <button id="d-saveas">${ICONS.saveas}Enregistrer sous…</button>
          <button id="d-export">${ICONS.exporter}Exporter (.zip)</button>
          <hr class="menu-sep">
          <button id="d-settings">${ICONS.parametres}Paramètres</button>
        </div>
      </section>

      <section class="card">
        <h3>Comment ça marche</h3>
        <p>La copie de travail du deck est <strong>en cache dans le navigateur</strong> : vous pouvez modifier et prévisualiser sans rien écrire sur le disque.</p>
        <p>Sur le disque, un deck est <strong>un fichier unique <code>&lt;nom&gt;.mdk</code></strong> — une archive ZIP contenant toute l'arborescence du projet :</p>
        <pre class="deck-structure">MonDeck.mdk
├── mydeck.json    manifeste : version du format deck (${deckfs.DECK_FORMAT})
├── deck.md        Markdown du deck
├── style.css      style du deck
├── images/        images et SVG référencés
└── versions/      versions antérieures de deck.md (10 max)</pre>
        <p class="muted">À chaque enregistrement sur disque, si le Markdown a changé, l'ancien <code>deck.md</code> est archivé dans <code>versions/</code> à l'intérieur du .mdk.</p>
        <p class="muted">« Enregistrer » réutilise l'emplacement du dernier « Enregistrer sous » de la session ; sinon il se comporte comme « Enregistrer sous ».</p>
      </section>
    </div>`;

  const status = app.querySelector('#d-status');
  const currentDeck = () => getDeck(getSettings().lastDeck) || getDecks()[0] || null;
  const updateStatus = () => {
    const deck = currentDeck();
    const parts = [];
    parts.push(deck ? `Deck en cache : « ${deck.name} »` : 'Aucun deck en cache');
    parts.push(deckfs.saveHandleName()
      ? `fichier : ${deckfs.saveHandleName()}`
      : 'aucun fichier .mdk lié cette session');
    status.textContent = parts.join(' — ');
    status.classList.toggle('linked', !!deckfs.saveHandleName());
  };
  updateStatus();

  /* ---- Nouveau deck ---- */
  app.querySelector('#d-new').addEventListener('click', () => {
    const name = prompt('Nom du nouveau deck :', 'Deck sans titre');
    if (name === null) return;
    newDeck(name.trim() || 'Deck sans titre');
    location.hash = '#/create';
  });

  /* ---- Ouvrir un .mdk ---- */
  app.querySelector('#d-open').addEventListener('click', async () => {
    try {
      const d = await deckfs.openDeck();
      if (!d) return;
      if (d.format && !deckfs.isFormatSupported(d.format)) {
        const go = confirm(
          `Ce deck utilise un format plus récent (${d.format} > ${deckfs.DECK_FORMAT}).\n` +
          `myDeck ne garantit pas la compatibilité : l'enregistrer pourrait le rendre inutilisable par cette version.\n\nL'ouvrir quand même ?`
        );
        if (!go) return;
      } else if (!d.format && (d.md || d.css)) {
        alert(`Deck sans manifeste (ancien format) — il sera mis au format ${deckfs.DECK_FORMAT} au prochain enregistrement.`);
      }
      if (!d.md && !d.css) {
        const ok = confirm('Ce .mdk ne contient pas de deck.md — l\'initialiser comme nouveau deck ?');
        if (!ok) return;
      }
      const existing = getDecks().find((x) => x.name === d.name);
      const deck = existing
        ? { ...existing, md: d.md, css: d.css }
        : { id: crypto.randomUUID(), name: d.name, md: d.md, css: d.css };
      storeDeck(deck);
      updateStatus();
      location.hash = '#/create';
    } catch (e) {
      alert('Ouverture impossible : ' + e.message);
    }
  });

  /* ---- Enregistrer (fichier .mdk) ---- */
  app.querySelector('#d-save').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return alert('Aucun deck courant.');
    try {
      const r = await deckfs.saveDeck(deck);
      if (!r || r.cancelled) return;
      updateStatus();
      alert(r.where === 'download'
        ? `Deck « ${deck.name} » enregistré : ${r.filename} (téléchargement).`
        : `Deck « ${deck.name} » enregistré dans ${r.filename}.`);
    } catch (e) {
      alert('Enregistrement impossible : ' + e.message);
    }
  });

  /* ---- Enregistrer sous… (choix de l'emplacement) ---- */
  app.querySelector('#d-saveas').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return alert('Aucun deck courant.');
    try {
      const r = await deckfs.saveDeckAs(deck);
      if (!r || r.cancelled) return;
      updateStatus();
      alert(r.where === 'download'
        ? `Deck « ${deck.name} » enregistré : ${r.filename} (téléchargement — votre navigateur ne supporte pas le choix d'emplacement).`
        : `Deck « ${deck.name} » enregistré dans ${r.filename}.`);
    } catch (e) {
      alert('Enregistrement impossible : ' + e.message);
    }
  });

  /* ---- Exporter (.zip, archive lisible) ---- */
  app.querySelector('#d-export').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return alert('Aucun deck courant.');
    try {
      const r = await deckfs.exportZip(deck);
      alert(`Archive exportée : ${r.filename}`);
    } catch (e) {
      alert('Export impossible : ' + e.message);
    }
  });

  /* ---- Paramètres ---- */
  app.querySelector('#d-settings').addEventListener('click', () => { location.hash = '#/settings'; });
}
