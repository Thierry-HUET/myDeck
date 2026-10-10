# CHANGELOG.md — myDeck

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/) ; versionnement [SemVer](https://semver.org/lang/fr/).

## [0.3.0] — 2026-10-10

### Ajouté

- **Mode vertical** dans la page Création : WYSIWYG en haut, bloc création en bas (Markdown à gauche, CSS à droite) — bascule par bouton dans la barre d'outils.
- **Containers redimensionnables** : splitter principal (éditeurs ↔ affichage) et splitter interne (Markdown ↔ CSS), glisser-déposer Pointer Events, bornes 15–85 %.
- **Persistance du layout** : mode et proportions sauvegardés dans `settings.layout` ({ mode, main, sub }).

## [0.2.0] — 2026-10-10

### Ajouté

- **Application Node.js + Vite** : `npm run dev / build / preview` (remplace le visualiseur statique, conservé dans `legacy/`).
- **Routage par hash** : 3 pages — Création (`#/create`), Visualisation (`#/`), Paramètres (`#/settings`).
- **Page Création** : éditeur Markdown + éditeur CSS empilés à gauche (½ hauteur chacun), aperçu **WYSIWYG** live à droite, navigation de slides, bouton d'insertion `+ slide`, multi-decks avec sélecteur.
- **Page Paramètres** : thème par variables CSS (fond, texte, accent, polices), suppression de decks, export/import JSON.
- **Persistance localStorage** : decks ({id, name, md, css, updatedAt}) et settings ; deck d'exemple chargé automatiquement au premier lancement.
- Nettoyage des écouteurs entre pages (fonction cleanup retournée par chaque page).

### Modifié

- Structure du projet : sources dans `src/` (pages, styles, store, moteur md2slides), assets dans `public/`, visualiseur v0.1 déplacé dans `legacy/`.
- README et SPECIFICATION réécrits pour la nouvelle architecture.

## [0.1.0] — 2026-10-10

### Ajouté

- Visualiseur de présentations Markdown → slides 16:9 (`index.html`, `app.js`, `style.css`).
- Découpage des slides par ligne `---` (`***`, `___` acceptés).
- Rendu Markdown via marked.js v12 (CDN) avec repli texte brut hors-ligne.
- Slide de titre automatique (centrage) pour les blocs commençant par `#`.
- Navigation complète : clavier (`←`/`→`, `Espace`, `PageUp/Down`, `Home`/`End`), clic moitié gauche/droite, swipe tactile.
- Plein écran (`F`), vue d'ensemble par miniatures (`O`), barre de progression, compteur de slides.
- Deep-linking : `index.html#4` ouvre directement la slide 4.
- Impression / export PDF : une slide par page (`Ctrl+P`).
- Paramètre d'URL `?deck=mon-fichier.md` pour charger un deck alternatif.
- Thème piloté par variables CSS (`--slide-bg`, `--slide-color`, `--accent`).
- Dépôt initialisé avec `README.md`, `SPECIFICATION.md`, `VERSION`, `TODO.md`, `CHANGELOG.md`.
- Licence Apache 2.0 (© 2026 Thierry HUET — APERTO-NOTA).
