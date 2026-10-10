# SPECIFICATION.md — myDeck

## 1. Objet

myDeck est un visualiseur de présentations type PowerPoint fonctionnant entièrement côté navigateur, à partir de deux fichiers :

- un deck **Markdown** (`.md`) contenant les slides ;
- une feuille de style **CSS** définissant le thème.

Aucune dépendance à installer ni build à exécuter : un simple serveur HTTP statique suffit.

## 2. Architecture

```
index.html   — page hôte : scène (#stage), slide (#slide), HUD, barre de progression, vue d'ensemble
app.js       — moteur : chargement du deck, rendu Markdown, navigation, impression
style.css    — thème (variables CSS) et styles d'impression
deck.md      — présentation chargée par défaut
```

Bibliothèque externe unique : [marked.js](https://github.com/markedjs/marked) v12 (CDN jsDelivr) pour le rendu Markdown. En son absence, un repli minimal (échappement HTML + sauts de ligne) est appliqué.

## 3. Format du deck

- Chaque slide est un bloc Markdown séparé par une ligne `---`, `***` ou `___` (seule sur sa ligne, espaces autorisés).
- Un bloc commençant par un titre `#` est rendu comme **slide de titre** (classe `.title-slide`, centrage automatique).
- Tout le Markdown de base est supporté : titres, listes, gras/italique, code inline et blocs, citations, liens, images, tableaux.

## 4. Exigences fonctionnelles

| ID | Exigence |
|----|----------|
| F1 | Charger le fichier `deck.md` (ou `?deck=<chemin>` en paramètre d'URL) via `fetch()` |
| F2 | Découper le Markdown en slides (`---`) et ignorer les blocs vides |
| F3 | Rendre la slide courante en 16:9, dimensionnée à la fenêtre |
| F4 | Navigation : ←/→, Espace, PageUp/PageDown, Home/End, clic (moitié gauche/droite), swipe tactile (> 50 px) |
| F5 | Plein écran via `F` ou bouton (Fullscreen API) |
| F6 | Vue d'ensemble (`O`) : miniatures cliquables de toutes les slides, slide active surlignée |
| F7 | Barre de progression et compteur `n / total` |
| F8 | Deep-link : `#4` ouvre la slide 4 ; navigation mise à jour dans l'URL |
| F9 | Impression/PDF : `Ctrl+P` génère une slide par page (saut de page forcé) |
| F10 | Thème modifiable sans toucher au code : variables `--slide-bg`, `--slide-color`, `--accent`, `--font-*` |
| F11 | Message d'erreur explicite si le deck ne charge pas (serveur HTTP manquant, 404…) |
| F12 | Dépôt et projet sous licence Apache 2.0 |

## 5. Contraintes techniques

- **Navigateurs** : ES2020+ (optional chaining, `aspect-ratio`, `:root` variables) — Chrome/Edge/Firefox/Safari récents.
- **Aucun build** : le site fonctionne tel quel depuis n'importe quel hébergeur statique (GitHub Pages inclus).
- **Pas de état serveur** : tout est calculé côté client ; le `.md` est récupéré par `fetch()` (d'où l'exigence d'un serveur HTTP, `file://` étant insuffisant).
- **Empreinte minimale** : un seul fichier CSS, un seul fichier JS, zéro configuration.

## 6. Cas d'erreur

| Cas | Comportement |
|-----|--------------|
| `deck.md` introuvable / pas de serveur HTTP | Slide d'erreur avec instructions (`python3 -m http.server`, Live Server) |
| Deck vide (aucun bloc) | Message « Le deck est vide. » |
| `#0`, `#999`… (hash invalide) | Retour à la slide 1 |
| `marked` indisponible (hors-ligne) | Rendu de repli texte brut |

## 7. Évolutions envisagées

Voir `TODO.md`.
