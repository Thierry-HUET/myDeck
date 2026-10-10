# SPECIFICATION.md — myDeck

## 1. Objet

myDeck est une application web de création et de présentation de slides type PowerPoint, à partir de contenu **Markdown** et de styles **CSS**.

- **Stack** : Node.js + Vite, JavaScript natif (ES modules), aucune framework.
- **Rendu** : navigateur web ; Markdown rendu par marked.js.
- **Persistance** : localStorage (decks, paramètres, thème) ; pas de backend.

## 2. Architecture

### 2.1 Pages (routage par hash — `src/main.js`)

| Route | Page | Rôle |
|-------|------|------|
| `#/create` | Création | Éditeur Markdown + éditeur CSS à gauche (chacun ½ hauteur), aperçu WYSIWYG à droite |
| `#/` | Visualisation | Présentation plein écran, navigation, impression |
| `#/deck` | Slides | Menu slides : Nouveau, Ouvrir, Enregistrer, Enregistrer sous, Exporter, Paramètres |
| `#/settings` | Paramétrage | Thème, gestion des decks, import/export JSON |

### 2.2 Modules

```
src/main.js            — routeur : résout #/xxx → src/pages/page-xxx.js, gère le nettoyage des écouteurs
src/store.js           — decks et settings en localStorage, application du thème (variables CSS)
src/md2slides.js       — splitSlides (---), md2html (marked), renderSlideInto, applyDeckCss
src/deckfs.js          — decks sur disque : fichier unique .mdk (ZIP), versions du deck.md, export ZIP
src/pages/page-*       — une fonction mount(app) par page, retourne un cleanup optionnel
src/styles/global.css  — coquille applicative (barre, éditeurs, HUD, formulaires)
src/styles/slides.css  — style des .slide (partagé WYSIWYG et visualisation)
public/                — deck d'exemple chargé au premier lancement
```

### 2.3 Modèle de données

```js
deck    = { id: UUID, name, md, css, updatedAt }
settings = { theme: { bg, color, accent, heading, body }, lastDeck }
```

## 3. Page Création

### 3.1 Layouts

Deux modes, réglés depuis la **page Paramètres** et persistés dans `settings.layout.mode` :

- **horizontal** (défaut) : éditeurs Markdown/CSS empilés à gauche, WYSIWYG à droite ;
- **vertical** : WYSIWYG en haut, bloc création en bas — Markdown à gauche, CSS à droite.

### 3.2 Redimensionnement

- **Splitter principal** (`data-split="main"`) : proportion éditeurs ↔ affichage (variable CSS `--main`, 15–85 %).
- **Splitter interne** (`data-split="sub"`) : proportion Markdown ↔ CSS (variable `--sub`, 15–85 %).
- Glisser-déposer par Pointer Events avec capture du pointeur ; le curseur s'adapte (`col-resize` / `row-resize` selon le mode).
- Positions persistées dans `settings.layout` (main, sub) via `saveSettings`.

### 3.3 Fonctions

- Barre d'outils WYSIWYG : sélecteur de deck, navigation ←/→ avec compteur `n / total`, enregistrement (`💾`), création de deck (`+ Nouveau`).
- Bouton `+ slide` : insère `\n\n---\n\n` à la position du curseur dans le Markdown.
- Le CSS du deck est injecté en direct dans l'aperçu (`<style data-deck-css>`).
- La navigation clavier de l'aperçu est inactive quand le focus est dans un éditeur.

## 4. Page Visualisation

- Charge le deck indiqué (`?id=`), sinon le dernier utilisé, sinon le premier.
- Navigation : `←/→`, `Espace`, `PageUp/Down`, `Home/End`, clic moitié gauche/droite, swipe tactile (> 50 px).
- `F` plein écran, `O` vue d'ensemble par miniatures, `Esc` fermeture.
- Barre de progression + compteur ; deep-link `#4` (slide 4).
- `Ctrl+P` : impression une slide par page (`#print-deck` + `page-break-after`).

## 5. Page Slides (`#/deck`)

**Modèle de persistance** :
- **Cache de travail** : le deck en cours vit dans le navigateur (localStorage, cf. §store.js) — modification et prévisualisation sans écriture disque.
- **Disque** : un deck est **un fichier unique `<nom>.mdk`** — une archive ZIP contenant toute l'arborescence du projet :

```
MonDeck.mdk
├── mydeck.json — manifeste : version du format deck (compatibilité)
├── deck.md     — contenu Markdown
├── style.css    — style du deck
├── images/      — images et SVG référencés par le Markdown
└── versions/    — versions antérieures de deck.md (10 max)
```

L'extension **`.mdk`** est propre à myDeck ; l'archive reste un ZIP standard, lisible par tout outil.

### 5.1 Menu

- **Nouveau deck** : crée un deck vierge (nom demandé) dans le cache et ouvre la page Création.
- **Ouvrir (.mdk)…** : lit un fichier `.mdk` (`showOpenFilePicker`, repli sélecteur classique), restaure `deck.md`, `style.css`, les images et les versions dans le cache. Un deck homonyme existant est mis à jour au lieu d'être dupliqué.
- **Enregistrer** : écrit le deck sans jamais ouvrir d'explorateur une fois le **dossier des decks** désigné (demandé une seule fois au premier enregistrement, mémorisé dans IndexedDB). Priorité : fichier `.mdk` spécifique lié au deck (issu d'« Ouvrir » ou « Enregistrer sous »), sinon `<nom du deck>.mdk` dans le dossier des decks.
- **Enregistrer sous…** : choisit l'emplacement (`showSaveFilePicker`, repli téléchargement) et écrit `<nom du deck>.mdk`. Si le Markdown a changé depuis la dernière écriture, l'ancien `deck.md` est archivé dans `versions/deck-AAAAMMJJ_hhmmss.md` à l'intérieur de l'archive (10 dernières versions conservées).
- **Exporter (.zip)** : télécharge la même arborescence sous forme d'archive ZIP standard, lisible partout.
- ────────────
- **Paramètres** : accède à la page Paramétrage (`#/settings`).

### 5.2 Version du format deck (compatibilité)

- Chaque `.mdk` contient un manifeste **`mydeck.json`** : `{ format, name, savedAt }`.
- `format` est la version du **format deck** (actuellement `1.1`), incrémentée à chaque changement de structure de l'archive. Elle est indépendante de la version de l'application.
- À l'**ouverture** : un deck au format plus récent que celui supporté déclenche un avertissement (perte de garantie de compatibilité) ; un deck sans manifeste (ancien format) est signalé et mis au format courant au prochain enregistrement.

### 5.3 Support navigateur

Le choix d'emplacement (`showSaveFilePicker` / `showOpenFilePicker`) repose sur la File System Access API (Chrome, Edge, Opera) ; ailleurs, repli automatique sur le téléchargement et le sélecteur de fichier classique. La lecture ZIP supporte les méthodes store (0) et deflate (8) via `DecompressionStream`.

## 6. Page Paramétrage

- Thème : fond (couleur ou gradient), couleur de texte, accent, polices — appliqué globalement via variables CSS sur `:root`.
- **Polices** : menus déroulants alimentés par les polices détectées dans le navigateur (`document.fonts.check` sur une liste candidate + familles génériques). L'import de polices extérieures (Google Fonts) est prévu dans la TODO.
- **Disposition (page Création)** : sélecteur du mode (horizontal / vertical), persisté dans `settings.layout.mode`.
- Gestion des decks : liste, suppression.
- Export/import JSON (decks + settings).

## 7. Contraintes techniques

- **Navigateurs** : ES2020+ (Chrome/Edge/Firefox/Safari récents).
- **Aucun backend** : tout est client ; `npm run dev` (Vite) pour le développement, `npm run build` pour la production (dossier `dist/` déployable sur tout hébergeur statique).
- **Dépendances** : `marked` (rendu Markdown) ; `vite` en dev.

## 7. Compatibilité

`legacy/` conserve le visualiseur statique v0.1 (index.html + app.js + style.css), fonctionnel sans Node.

## 8. Évolutions

Voir `TODO.md`.
