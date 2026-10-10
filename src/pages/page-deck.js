/* ============================================================
   page-deck.js — menu Deck
   Nouveau · Ouvrir · Enregistrer · Enregistrer sous · Exporter
   ──────────── · Paramètres
   Un deck = un répertoire (deck.md, style.css, images/, versions/).
   ============================================================ */
import { getDecks, getDeck, getSettings, saveDeck as storeDeck, newDeck } from '../store.js';
import * as deckfs from '../deckfs.js';

/* Icônes flat sobres (trait 2px, currentColor) */
const ICONS = {
  nouveau: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  ouvrir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  enregistrer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  saveas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/><path d="M2 2"/><path d="m10 15 4 4"/><path d="m14 15-4 4"/></svg>',
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
          <button id="d-open">${ICONS.ouvrir}Ouvrir…</button>
          <button id="d-save">${ICONS.enregistrer}Enregistrer</button>
          <button id="d-saveas">${ICONS.saveas}Enregistrer sous…</button>
          <button id="d-export">${ICONS.exporter}Exporter (ZIP)</button>
          <hr class="menu-sep">
          <button id="d-settings">${ICONS.parametres}Paramètres</button>
        </div>
      </section>

      <section class="card">
        <h3>Structure d'un deck</h3>
        <p>Un deck est un <strong>répertoire</strong>, pas un fichier :</p>
        <pre class="deck-structure">MonDeck/
├── mydeck.json    manifeste : version du format deck
├── deck.md        Markdown du deck
├── style.css       style du deck
├── images/         images et SVG référencés (ex. ![](images/logo.svg))
└── versions/       versions antérieures de deck.md</pre>
        <p class="muted">À chaque <em>Enregistrer</em>, l'ancien <code>deck.md</code> est archivé dans <code>versions/</code> (les 10 dernières versions sont conservées).</p>
        <p class="muted">Le manifeste <code>mydeck.json</code> porte la <strong>version du format</strong> du deck (actuellement <code>${deckfs.DECK_FORMAT}</code>) pour assurer la compatibilité : un deck créé par une version plus récente de myDeck est signalé à l'ouverture.</p>
        <p class="muted">L'accès aux répertoires utilise la File System Access API (Chrome, Edge, Opera). Sur Firefox/Safari, utilisez <em>Exporter</em> ou l'import/export JSON des Paramètres.</p>
      </section>
    </div>`;

  const status = app.querySelector('#d-status');
  const updateStatus = () => {
    const linked = deckfs.linkedDirName();
    status.textContent = linked
      ? ` Répertoire lié : ${linked}`
      : ' Aucun répertoire lié — « Enregistrer sous » pour choisir un répertoire.';
    status.classList.toggle('linked', !!linked);
  };
  updateStatus();

  const currentDeck = () => getDeck(getSettings().lastDeck) || getDecks()[0] || null;

  /* ---- Nouveau deck ---- */
  app.querySelector('#d-new').addEventListener('click', () => {
    const name = prompt('Nom du nouveau deck :', 'Deck sans titre');
    if (name === null) return;
    newDeck(name.trim() || 'Deck sans titre');
    location.hash = '#/create';
  });

  /* ---- Ouvrir un répertoire deck ---- */
  app.querySelector('#d-open').addEventListener('click', async () => {
    if (!deckfs.fsSupported()) {
      alert("Votre navigateur ne supporte pas l'accès aux répertoires (File System Access API). Utilisez Chrome ou Edge, ou passez par l'import JSON des Paramètres.");
      return;
    }
    try {
      const d = await deckfs.openDeck();
      if (d.format && !deckfs.isFormatSupported(d.format)) {
        const go = confirm(
          `Ce deck a été créé avec un format plus récent (${d.format} > ${deckfs.DECK_FORMAT}).\n` +
          `myDeck ne garantit pas la compatibilité : l'enregistrer pourrait le rendre inutilisable par cette version.\n\nL'ouvrir quand même ?`
        );
        if (!go) return;
      } else if (!d.format && (d.md || d.css)) {
        alert('Deck sans manifeste mydeck.json (ancien format) — il sera mis au format ' + deckfs.DECK_FORMAT + ' au prochain enregistrement.');
      }
      if (!d.md && !d.css) {
        const ok = confirm('Ce répertoire ne contient pas de deck.md — l\'initialiser comme nouveau deck ?');
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
      if (e.name !== 'AbortError') alert('Ouverture impossible : ' + e.message);
    }
  });

  /* ---- Enregistrer dans le répertoire lié ---- */
  app.querySelector('#d-save').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return alert('Aucun deck courant.');
    if (!deckfs.linkedDirName()) {
      return alert("Aucun répertoire lié — utilisez « Enregistrer sous » pour en choisir un.");
    }
    try {
      const { archived } = await deckfs.saveDeck(deck);
      alert(archived
        ? `Deck « ${deck.name} » enregistré.\nVersion précédente archivée dans versions/.`
        : `Deck « ${deck.name} » enregistré.`);
      updateStatus();
    } catch (e) {
      alert('Enregistrement impossible : ' + e.message);
    }
  });

  /* ---- Enregistrer sous… (nouveau répertoire) ---- */
  app.querySelector('#d-saveas').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return alert('Aucun deck courant.');
    if (!deckfs.fsSupported()) {
      alert("Votre navigateur ne supporte pas l'accès aux répertoires (File System Access API). Utilisez l'export JSON des Paramètres.");
      return;
    }
    try {
      await deckfs.saveDeckAs(deck);
      alert(`Deck « ${deck.name} » enregistré dans le répertoire lié.`);
      updateStatus();
    } catch (e) {
      if (e.name !== 'AbortError') alert('Enregistrement impossible : ' + e.message);
    }
  });

  /* ---- Exporter en ZIP ---- */
  app.querySelector('#d-export').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return alert('Aucun deck courant.');
    try {
      await deckfs.exportZip(deck);
    } catch (e) {
      alert('Export impossible : ' + e.message);
    }
  });

  /* ---- Paramètres ---- */
  app.querySelector('#d-settings').addEventListener('click', () => { location.hash = '#/settings'; });
}
