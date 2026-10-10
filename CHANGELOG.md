# CHANGELOG.md — myDeck

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/) ; versionnement [SemVer](https://semver.org/lang/fr/).

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
