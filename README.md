# myDeck

> Affichez des présentations type PowerPoint à partir d'un simple fichier **Markdown** (`.md`) et d'une feuille de style **CSS**.

## ✨ Fonctionnalités

- **Slides en Markdown** : une ligne `---` sépare deux slides
- Rendu complet : titres, listes, tableaux, code, citations, images, liens
- **Thème 100 % personnalisable** via `style.css` (variables CSS)
- Navigation : clavier (`←` `→`, `Espace`, `Home`/`End`), tactile (swipe), clic
- **Plein écran** (`F`), **vue d'ensemble** (`O`)
- **Impression / PDF** : une slide par page (`Ctrl+P`)
- Deep-link : `index.html#4` ouvre directement la slide 4

## 🚀 Démarrage

Le chargement du `.md` utilise `fetch()` : il faut donc un petit serveur HTTP local (et non l'ouverture directe du fichier).

```bash
# Option 1 : Python
python3 -m http.server 8000
# puis ouvrir http://localhost:8000

# Option 2 : VS Code
# Installer l'extension "Live Server" → clic droit sur index.html → "Open with Live Server"

# Option 3 : Node
npx serve
```

## 📄 Format du deck

Éditez `deck.md` (ou passez un autre fichier via `?deck=mon-fichier.md`) :

```md
# Titre de la présentation          ← slide de titre
## Sous-titre

---

## Deuxième slide

- **Gras**, *italique*, `code`
- [Liens](https://github.com)

---

# Merci !
```

## 🎨 Thème

Tout le style est concentré dans `style.css`, piloté par des variables :

```css
:root {
  --slide-bg: linear-gradient(135deg, #0f172a, #1e293b);
  --slide-color: #f8fafc;
  --accent: #38bdf8;
}
```

Changez ces trois lignes (ou le fichier entier) pour obtenir votre identité visuelle, sans toucher au code.

## ⌨️ Raccourcis

| Touche | Action |
|--------|--------|
| `←` / `→` ou `Espace` | Slide précédente / suivante |
| `Home` / `End` | Première / dernière slide |
| `F` | Plein écran |
| `O` | Vue d'ensemble (miniatures) |
| `Ctrl+P` | Impression / PDF |

## 📜 Licence

Distribué sous licence [Apache 2.0](LICENSE) — © Thierry HUET / APERTO-NOTA.
