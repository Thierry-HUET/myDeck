/* ============================================================
   store.js — persistance locale (localStorage)
   Decks : [{ id, name, md, css, updatedAt }]
   Settings : { theme: { bg, color, accent, heading, body }, lastDeck }
   ============================================================ */

const KEY_DECKS = 'mydeck.decks';
const KEY_SETTINGS = 'mydeck.settings';

function defaultSettings() {
  return {
    theme: {
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc',
      accent: '#38bdf8',
      heading: '"Segoe UI", Calibri, sans-serif',
      body: '"Segoe UI", Calibri, sans-serif',
    },
    lastDeck: null,
  };
}

let settings = JSON.parse(localStorage.getItem(KEY_SETTINGS) || 'null') || defaultSettings();

/* ---------- Settings ---------- */

export const getSettings = () => settings;

export function saveSettings(s) {
  settings = s;
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
  applyTheme();
}

export function applyTheme() {
  const r = document.documentElement.style;
  const t = settings.theme;
  r.setProperty('--slide-bg', t.bg);
  r.setProperty('--slide-color', t.color);
  r.setProperty('--accent', t.accent);
  r.setProperty('--font-heading', t.heading);
  r.setProperty('--font-body', t.body);
}

/* ---------- Decks ---------- */

export const getDecks = () => JSON.parse(localStorage.getItem(KEY_DECKS) || '[]');
export const getDeck = (id) => getDecks().find((d) => d.id === id) || null;

export function saveDeck(deck) {
  const decks = getDecks();
  deck.updatedAt = Date.now();
  const i = decks.findIndex((d) => d.id === deck.id);
  if (i >= 0) decks[i] = deck; else decks.push(deck);
  localStorage.setItem(KEY_DECKS, JSON.stringify(decks));
  settings.lastDeck = deck.id;
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  return deck;
}

export function deleteDeck(id) {
  localStorage.setItem(KEY_DECKS, JSON.stringify(getDecks().filter((d) => d.id !== id)));
  if (settings.lastDeck === id) { settings.lastDeck = null; localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)); }
}

export function newDeck(name) {
  const n = name || 'Deck sans titre';
  return saveDeck({
    id: crypto.randomUUID(),
    name: n,
    md: `# ${n}\n\n*Sous-titre*\n\n---\n\n## Slide 2\n\n- Premier point\n- Deuxième point\n`,
    css: '',
  });
}

/* Premier lancement : charge le deck d'exemple depuis public/ */
export async function ensureSample() {
  if (getDecks().length) return;
  const fetchTxt = (p) => fetch(import.meta.env.BASE_URL + p).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  const [md, css] = await Promise.all([fetchTxt('deck.md'), fetchTxt('style.css')]);
  saveDeck({ id: crypto.randomUUID(), name: "Deck d'exemple", md, css });
}
