# TODO.md — myDeck

## 🎯 Priorité haute

- [ ] **Mode présentateur** : vue double écran (slide publique + notes et slide suivante sur l'écran du présentateur) via `PresentationRequest` ou `window.open` synchronisé par `BroadcastChannel`.
- [ ] **Notes présentateur** : syntaxe `?? notes…` sous chaque slide dans le `.md`, invisibles en projection.

## 🛠️ Améliorations

- [ ] **Importer des polices extérieures** (Google Fonts & co.) : chargement dynamique via `<link>` ou CSS `@import` + ajout automatique dans les menus déroulants des polices.
- [ ] **Historique des versions** : interface de restauration (lister `versions/`, prévisualiser, revenir à une version) et vue diff entre deux versions.
- [ ] **Ajout d'images depuis l'app** : glisser-déposer d'une image dans l'éditeur → stockage dans le cache du deck + insertion du Markdown `![](images/…)` ; l'image est écrite dans `images/` du `.mdk` au prochain enregistrement.
- [ ] **Transitions** entre slides (fondu, glissement) pilotables par une variable CSS `--transition`.
- [ ] **Fragments** : affichage progressif des listes (une pression = un élément) via un marqueur Markdown (`- <!--frag-->`).
- [ ] **Numérotation de slide** optionnelle (coin bas-droit) activable par variable CSS.
- [ ] **Navigation par miniature en bas d'écran** (aperçu des 5 slides voisines au survol).
- [ ] **Sommaire cliquable** sur la slide de titre (ancres internes).
- [ ] **Support de MathJax/KaTeX** pour les formules LaTeX (`$$…$$`).
- [ ] **Diagrammes Mermaid** dans les blocs de code ```` ```mermaid ````.
- [ ] **Mode sombre/clair** commutable (`L`), thème par variable `data-theme`.

## 🧪 Robustesse

- [ ] **Marquage du `.md` local** : fallback `embedded deck` si aucun serveur HTTP n'est détecté (deck par défaut inclus dans `index.html`).
- [ ] **Mode hors-ligne complet** : embarquer marked.js localement (fin de la dépendance CDN) et ajouter un manifeste PWA + service worker.
- [ ] **Tests navigateur** automatisés (Playwright) : navigation, découpage, impression.

## 📦 Distribution

- [ ] **GitHub Pages** : publier une démo en ligne du `deck.md` d'exemple.
- [ ] **Thèmes prédéfinis** : dossier `themes/` (sombre, clair, corporate, séminaire) sélectionnables par `?theme=`.
- [ ] **CLI légère** : `npx mydeck init` générant un squelette de deck.

## ✅ Terminé (récapitulatif)

- [x] Découpage Markdown en slides (v0.1.0)
- [x] Navigation clavier / tactile / clic (v0.1.0)
- [x] Plein écran, vue d'ensemble, deep-link (v0.1.0)
- [x] Impression 1 slide/page (v0.1.0)
