# CHANGELOG.md — myDeck

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/) ; versionnement [SemVer](https://semver.org/lang/fr/).

## [0.8.0] — 2026-10-10

### Modifié

- **Menu renommé « Deck » → « Slides »** et repositionné dans la barre supérieure : à gauche, juste après le titre myDeck (Création et Visualisation restent à droite). La route `#/deck` est inchangée ; le titre de la page devient « Slides ».

## [0.7.2] — 2026-10-10

### Corrigé

- **Régression v0.7.1** : page Deck blanche — un `await` dans `mount` (fonction non asynchrone) provoquait une SyntaxError ESM au chargement du module. L'initialisation de la liste du dossier des decks est désormais lancée sans bloquer le montage.

## [0.7.1] — 2026-10-10

### Ajouté

- **Visibilité de l'emplacement d'enregistrement** : les retours d'« Enregistrer » (page Création et page Deck) affichent `dossier/nom-du-deck.mdk`. Note : par sécurité, les navigateurs ne révèlent jamais le chemin absolu d'un dossier choisi — seul son nom est accessible.
- **Page Deck, carte « Dossier des decks »** : nom du dossier désigné + liste des fichiers `.mdk` qu'il contient, et bouton **« Changer de dossier… »** pour re-ancrer la sauvegarde à un emplacement connu.

## [0.7.0] — 2026-10-10

### Ajouté

- **Dossier des decks (bibliothèque)** : réponse définitive à l'ouverture systématique du sélecteur. Au premier « Enregistrer », myDeck demande **une seule fois** un dossier ; ensuite, tous les « Enregistrer » (page Création ou Deck, tous decks confondus) écrivent directement `<nom du deck>.mdk` dans ce dossier — **sans jamais rouvrir l'explorateur**, y compris après rechargement (permission re-demandée par une simple confirmation native au pire).
- Ordre d'écriture : fichier `.mdk` spécifique lié au deck (issu d'« Ouvrir » ou « Enregistrer sous ») en priorité, sinon dossier des decks.
- Statut de la page Deck et info-bulle du bouton Enregistrer : affichent le dossier des decks ou le fichier lié.

## [0.6.5] — 2026-10-10

### Corrigé

- **Port Vite strict** (`strictPort: true`) : quand 5173 était occupé, Vite basculait sur 5174 — une autre *origine* pour le navigateur, où IndexedDB (lien deck ↔ fichier .mdk) et les permissions accordées n'existent pas. Le sélecteur s'ouvrait donc à chaque session. myDeck refuse désormais de démarrer sur un autre port ; fermez l'autre instance (ou l'application occupant 5173) au lieu de changer d'origine.

## [0.6.4] — 2026-10-10

### Corrigé

- **Handle .mdk lié à l'ID du deck** (et non plus global) : chaque deck retrouve son propre fichier ; plus de risque d'écrire le deck B dans le fichier du deck A.
- `restoreSaveHandle` : restauration fiabilisée (reset propre avant lecture IndexedDB).

### Ajouté

- **Visibilité du fichier lié** : info-bulle du bouton Enregistrer (page Création) et statut de la page Deck (« fichier lié : … »).
- **Diagnostic explicite** : si le sélecteur s'ouvre, la raison est affichée (« aucun-fichier-lié », « permission-refusée », « fichier-introuvable »).

## [0.6.3] — 2026-10-10

### Corrigé

- **« Enregistrer » ouvrait systématiquement l'explorateur** : la page Création ne passait pas par la restauration de l'emplacement mémorisé (IndexedDB) et appelait directement « Enregistrer sous ». Désormais « Enregistrer » réutilise bien l'emplacement en cours du deck.
- **Permission de fichier** : si le navigateur demande une revalidation, elle est demandée au moment du clic (activation utilisateur) — plus de repli injustifié sur le sélecteur d'emplacement. Le sélecteur ne s'ouvre que si aucun `.mdk` n'est lié au deck, ou en cas de refus/fichier disparu.

## [0.6.2] — 2026-10-10

### Ajouté

- **Emplacement en cours mémorisé** : le handle du fichier `.mdk` est persisté dans IndexedDB, lié à l'ID du deck. Si un deck est déjà en cours (ouvert ou enregistré), « Enregistrer » (menu Deck ou page Création) écrit **directement à l'endroit en cours**, y compris après rechargement de la page — sans redemander l'emplacement.
- À l'**ouverture** d'un `.mdk`, le fichier est automatiquement lié au deck : le premier « Enregistrer » suit l'emplacement d'origine.
- Repli : permission retirée ou fichier supprimé/déplacé → l'emplacement est redemandé proprement.

## [0.6.1] — 2026-10-10

### Corrigé

- **Bouton « Enregistrer » de la page Création désormais opérationnel** : il enregistre le deck dans le cache navigateur **puis** dans le fichier `.mdk` — réutilise l'emplacement du dernier « Enregistrer sous » de la session, sinon ouvre le choix d'emplacement. Retour visuel distinct (« ✓ Enregistré (.mdk) » / « ✓ .mdk téléchargé » / « ✓ Enregistré (cache) »).

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
