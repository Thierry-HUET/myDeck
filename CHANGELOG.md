# CHANGELOG.md — myDeck

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/) ; versionnement [SemVer](https://semver.org/lang/fr/).

## [0.6.0] — 2026-10-10

### Modifié

- **Nouveau modèle d'enregistrement** : le deck en cours est en **cache dans le navigateur** (localStorage, copie de travail) ; sur le disque, un deck est désormais **un fichier unique `<nom du deck>.mdk`** — une archive ZIP standard contenant toute l'arborescence du projet (`mydeck.json`, `deck.md`, `style.css`, `images/`, `versions/`). L'extension `.mdk` est propre à myDeck et non associée à un type existant.
- **Menu Deck** : « Ouvrir » lit un `.mdk` ; « Enregistrer » réutilise l'emplacement du dernier « Enregistrer sous » de la session ; « Enregistrer sous » choisit l'emplacement (`showSaveFilePicker`, repli téléchargement) ; « Exporter (.zip) » produit une archive ZIP lisible partout.
- **Versions du Markdown** : à chaque écriture sur disque, si le Markdown a changé, l'ancien `deck.md` est archivé dans `versions/` à l'intérieur du `.mdk` (10 dernières conservées).
- Choix d'emplacement : File System Access API avec repli automatique (téléchargement / sélecteur classique) sur les navigateurs non compatibles.

### Ajouté

- **Lecteur ZIP natif** : lecture des méthodes store (0) et deflate (8) via `DecompressionStream`, sans dépendance — round-trip testé (écriture/relecture, archive externe compressée, validation Python).
- **Format deck 1.1** (manifeste `mydeck.json` embarqué dans le `.mdk`).

## [0.5.1] — 2026-10-10

### Ajouté

- **Version du format deck** dans chaque répertoire : manifeste `mydeck.json` (`format`, `name`, `savedAt`), mis à jour à chaque enregistrement et embarqué dans l'export ZIP.
- **Contrôle de compatibilité** à l'ouverture : avertissement si le deck provient d'un format plus récent que celui supporté ; les decks sans manifeste (ancien format) sont signalés et mis au format courant au prochain enregistrement.

## [0.5.0] — 2026-10-10

### Ajouté

- **Page Deck** (`#/deck`) : le menu remplace « Paramètres » dans la barre supérieure. Fonctions : **Nouveau**, **Ouvrir**, **Enregistrer**, **Enregistrer sous**, **Exporter (ZIP)**, séparateur, **Paramètres** — icônes flat sobres (SVG inline).
- **Deck = répertoire** : `deck.md` + `style.css` + `images/` (images et SVG) + `versions/`. Ouverture/écriture via la **File System Access API**.
- **Gestion des versions du Markdown** : à chaque enregistrement, l'ancien `deck.md` est archivé dans `versions/deck-<horodatage>.md` (10 dernières versions conservées, purge automatique).
- **Export ZIP** du deck (`deck.md`, `style.css`, `images/*`) — écriture ZIP native sans dépendance.
- **Images des decks** : les `![](images/…)` sont résolus en aperçu WYSIWYG et en visualisation quand un répertoire est lié.

### Modifié

- Barre supérieure : « ⚙️ Paramètres » → « Deck » ; la page Paramètres reste accessible depuis le menu Deck.

## [0.4.1] — 2026-10-10

### Ajouté

- **Logo dans la barre supérieure** : `Logo_seul.webp` placé à gauche du nom « myDeck », sur la même ligne, hauteur alignée sur le texte (`1em`) — fichier attendu dans `public/`.

## [0.4.0] — 2026-10-10

### Ajouté

- **Sélecteur de disposition** dans la page Paramètres : mode horizontal ou vertical de la page Création (le bouton de bascule est retiré de la barre d'outils).
- **Menus déroulants de polices** (titres et corps) alimentés par les polices **détectées dans le navigateur** (`document.fonts.check` sur une liste candidate + familles génériques).
- TODO : import de polices extérieures (Google Fonts).

### Modifié

- La disposition de la page Création se règle désormais exclusivement depuis les Paramètres (`settings.layout.mode`).

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
