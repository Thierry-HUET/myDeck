# myDeck

> Créez et présentez des slides type PowerPoint à partir de fichiers **Markdown** (`.md`) et de feuilles de style **CSS**, dans une application web **Node.js + Vite**.

## 🏗️ Architecture

Application Node.js (Vite), visualisation dans le navigateur, trois pages (routage par hash) :

| Page | Route | Contenu |
|------|-------|---------|
| **Création** | `#/create` | À gauche : éditeur Markdown + éditeur CSS (empilés, ½ hauteur chacun). À droite : aperçu **WYSIWYG** de la slide courante |
| **Visualisation** | `#/` | Présentation plein écran : navigation clavier/tactile/clic, vue d'ensemble, impression 1 slide/page |
| **Paramètres** | `#/settings` | Thème (variables CSS), gestion des decks, import/export JSON |

Les decks (Markdown + CSS) sont persistés dans le **localStorage** du navigateur ; le deck d'exemple est chargé automatiquement au premier lancement.

## 🚀 Démarrage

```bash
npm install     # vite + marked
npm run dev     # http://localhost:5173
npm run build   # build de production dans dist/
npm run preview # prévisualiser le build
```

## ⌨️ Raccourcis (page Visualisation)

| Touche | Action |
|--------|--------|
| `←` / `→` ou `Espace` | Slide précédente / suivante |
| `Home` / `End` | Première / dernière slide |
| `F` | Plein écran |
| `O` | Vue d'ensemble (miniatures) |
| `Ctrl+P` | Impression / PDF (1 slide par page) |

## 📄 Format du deck

- Une ligne `---` sépare deux slides.
- Un bloc commençant par `#` est rendu comme slide de titre (centrée).
- Le CSS du deck (éditeur de droite) surcharge le thème global — chaque deck peut avoir son propre style.
- Le thème global (couleurs, polices, fond) se règle dans **Paramètres** et s'applique à tous les decks.

## 📂 Structure

```
index.html              coquille + navigation
src/main.js             routeur (hash) : #/ #/create #/settings
src/store.js            localStorage : decks, settings, thème
src/md2slides.js        Markdown → slides (marked.js)
src/pages/page-create.js     éditeurs MD/CSS + WYSIWYG
src/pages/page-view.js       présentation
src/pages/page-settings.js   paramétrage
src/styles/             global.css (app) + slides.css (slides)
public/                 deck d'exemple (deck.md, style.css)
legacy/                 visualiseur statique v0.1 (fichier unique)
```

## 📜 Licence

Distribué sous licence [Apache 2.0](LICENSE) — © Thierry HUET / APERTO-NOTA.
