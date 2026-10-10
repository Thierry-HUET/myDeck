/* ============================================================
   page-settings.js — Paramétrage
   Thème (variables CSS), deck par défaut, import/export JSON
   ============================================================ */
import { getSettings, saveSettings, getDecks, deleteDeck } from '../store.js';

export function mount(app) {
  const s = getSettings();
  const t = s.theme;

  app.innerHTML = `
    <div class="settings-page">
      <h2>⚙️ Paramètres</h2>

      <section class="card">
        <h3>Thème (variables CSS)</h3>
        <div class="form-grid">
          <label>Fond des slides (CSS — couleur ou gradient)
            <input id="s-bg" value="${t.bg.replace(/"/g, '&quot;')}">
          </label>
          <label>Couleur du texte
            <input id="s-color" type="color" value="${t.color}">
          </label>
          <label>Couleur d'accent
            <input id="s-accent" type="color" value="${t.accent}">
          </label>
          <label>Police des titres
            <input id="s-heading" value="${t.heading.replace(/"/g, '&quot;')}">
          </label>
          <label>Police du corps
            <input id="s-body" value="${t.body.replace(/"/g, '&quot;')}">
          </label>
        </div>
        <div class="card-actions">
          <button id="s-save" class="primary">💾 Appliquer</button>
          <button id="s-reset">↺ Valeurs par défaut</button>
        </div>
      </section>

      <section class="card">
        <h3>Decks enregistrés (navigateur)</h3>
        <ul id="deck-list" class="deck-list"></ul>
        <div class="card-actions">
          <button id="s-export">⬇️ Exporter (JSON)</button>
          <button id="s-import">⬆️ Importer</button>
          <input type="file" id="s-file" accept="application/json" hidden>
        </div>
      </section>

      <section class="card theme-demo">
        <h3>Aperçu</h3>
        <section class="slide"><h2>Titre de slide</h2><p>Texte avec <strong>gras</strong>, <em>italique</em> et <code>code</code>.</p><ul><li>Élément de liste</li></ul></section>
      </section>
    </div>`;

  const list = app.querySelector('#deck-list');
  const refreshList = () => {
    list.innerHTML = getDecks().map((d) => `
      <li>
        <span>${d.name} <small>${new Date(d.updatedAt || Date.now()).toLocaleString('fr-FR')}</small></span>
        <button data-del="${d.id}" class="danger">🗑 Supprimer</button>
      </li>`).join('') || '<li><em>Aucun deck.</em></li>';
  };
  refreshList();
  list.addEventListener('click', (e) => {
    const id = e.target.dataset?.del;
    if (id && confirm('Supprimer ce deck ?')) { deleteDeck(id); refreshList(); }
  });

  app.querySelector('#s-save').addEventListener('click', () => {
    const next = { ...s, theme: {
      bg: app.querySelector('#s-bg').value,
      color: app.querySelector('#s-color').value,
      accent: app.querySelector('#s-accent').value,
      heading: app.querySelector('#s-heading').value,
      body: app.querySelector('#s-body').value,
    }};
    saveSettings(next);
    alert('Thème appliqué.');
  });

  app.querySelector('#s-reset').addEventListener('click', () => {
    localStorage.removeItem('mydeck.settings');
    location.reload();
  });

  /* Export / Import */
  app.querySelector('#s-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ settings: getSettings(), decks: getDecks() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mydeck-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const file = app.querySelector('#s-file');
  app.querySelector('#s-import').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    try {
      const data = JSON.parse(await file.files[0].text());
      if (data.decks) localStorage.setItem('mydeck.decks', JSON.stringify(data.decks));
      if (data.settings) localStorage.setItem('mydeck.settings', JSON.stringify(data.settings));
      location.reload();
    } catch { alert('Fichier JSON invalide.'); }
  });
}
