/* ============================================================
   deckfs.js — decks sur disque (File System Access API)
   Un deck est un RÉPERTOIRE (pas un fichier) :
     deck.md     — contenu Markdown
     style.css   — style du deck
     images/     — images et SVG référencés par le Markdown
     versions/   — historique des versions du deck.md
   ============================================================ */

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
const MAX_VERSIONS = 10;

let dir = null;                 // FileSystemDirectoryHandle lié
const imgFiles = new Map();     // nom de fichier -> File
const imgUrls = new Map();      // nom de fichier -> objectURL

export const fsSupported = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window;
export const linkedDirName = () => (dir ? dir.name : null);

/* ---------- utilitaires répertoire ---------- */

async function readText(name) {
  try {
    const fh = await dir.getFileHandle(name);
    return await (await fh.getFile()).text();
  } catch { return ''; }
}

async function writeText(name, content) {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(content);
  await w.close();
}

async function getSub(name, create = false) {
  try { return await dir.getDirectoryHandle(name, { create }); }
  catch { return null; }
}

/* ---------- images du deck ---------- */

async function loadImages() {
  for (const url of imgUrls.values()) URL.revokeObjectURL(url);
  imgFiles.clear();
  imgUrls.clear();
  const imgDir = await getSub('images');
  if (!imgDir) return;
  for await (const [name, handle] of imgDir.entries()) {
    if (handle.kind === 'file' && IMG_EXT.test(name)) {
      const file = await handle.getFile();
      imgFiles.set(name, file);
      imgUrls.set(name, URL.createObjectURL(file));
    }
  }
}

/** Réécrit les src="images/…" d'un conteneur rendu vers les objets URL du répertoire lié. */
export function applyDeckImages(container) {
  container.querySelectorAll('img[src]').forEach((img) => {
    const m = img.getAttribute('src').match(/^(?:\.\/)?images\/(.+)$/);
    if (m && imgUrls.has(m[1])) img.src = imgUrls.get(m[1]);
  });
}

/* ---------- ouverture ---------- */

export async function openDeck() {
  dir = await window.showDirectoryPicker({ id: 'mydeck-open', mode: 'readwrite' });
  const md = await readText('deck.md');
  const css = await readText('style.css');
  await loadImages();
  return { name: dir.name, md, css };
}

/* ---------- gestion des versions du deck.md ---------- */

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

/** Archive le deck.md courant dans versions/ si le contenu va changer. */
async function archivePreviousMd(nextMd) {
  const previous = await readText('deck.md');
  if (!previous || previous === nextMd) return false;
  const vDir = await getSub('versions', true);
  if (!vDir) return false;
  const fh = await vDir.getFileHandle(`deck-${stamp()}.md`, { create: true });
  const w = await fh.createWritable();
  await w.write(previous);
  await w.close();
  /* Purge : ne conserve que les MAX_VERSIONS plus récentes (tri lexical = tri chrono) */
  const names = [];
  for await (const [name, h] of vDir.entries()) {
    if (h.kind === 'file' && /^deck-.+\.md$/.test(name)) names.push(name);
  }
  names.sort();
  for (const n of names.slice(0, Math.max(0, names.length - MAX_VERSIONS))) {
    await vDir.removeEntry(n).catch(() => {});
  }
  return true;
}

/* ---------- enregistrement ---------- */

/** Enregistre le deck dans le répertoire lié (versionne deck.md au passage). */
export async function saveDeck(deck) {
  if (!dir) throw new Error('Aucun répertoire lié.');
  const archived = await archivePreviousMd(deck.md || '');
  await writeText('deck.md', deck.md || '');
  await writeText('style.css', deck.css || '');
  return { archived };
}

/** Enregistre le deck dans un nouveau répertoire choisi par l'utilisateur, puis le lie. */
export async function saveDeckAs(deck) {
  dir = await window.showDirectoryPicker({ id: 'mydeck-saveas', mode: 'readwrite' });
  await getSub('images', true);
  await getSub('versions', true);
  await loadImages();
  return saveDeck(deck);
}

/* ---------- export ZIP (méthode « store », sans dépendance) ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

const crc32 = (u8) => {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zipStore(files) { // files : [{ name, data: Uint8Array }]
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameB = new TextEncoder().encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array(30 + nameB.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(8, 0, true);          // méthode 0 : store (sans compression)
    dv.setUint16(10, time, true);
    dv.setUint16(12, date, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, f.data.length, true);
    dv.setUint32(22, f.data.length, true);
    dv.setUint16(26, nameB.length, true);
    local.set(nameB, 30);
    chunks.push(local, f.data);
    central.push({ nameB, crc, size: f.data.length, offset });
    offset += local.length + f.data.length;
  }
  const centralChunks = [];
  let centralSize = 0;
  for (const c of central) {
    const h = new Uint8Array(46 + c.nameB.length);
    const dv = new DataView(h.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(10, 0, true);         // méthode 0 : store
    dv.setUint16(12, time, true);
    dv.setUint16(14, date, true);
    dv.setUint32(16, c.crc, true);
    dv.setUint32(20, c.size, true);
    dv.setUint32(24, c.size, true);
    dv.setUint16(28, c.nameB.length, true);
    dv.setUint32(42, c.offset, true);
    h.set(c.nameB, 46);
    centralChunks.push(h);
    centralSize += h.length;
  }
  const end = new Uint8Array(22);
  const dv = new DataView(end.buffer);
  dv.setUint32(0, 0x06054b50, true);
  dv.setUint16(8, central.length, true);
  dv.setUint16(10, central.length, true);
  dv.setUint32(12, centralSize, true);
  dv.setUint32(16, offset, true);
  return new Blob([...chunks, ...centralChunks, end], { type: 'application/zip' });
}

/** Exporte le deck courant en ZIP : deck.md, style.css, images/* */
export async function exportZip(deck) {
  const enc = new TextEncoder();
  const files = [
    { name: 'deck.md', data: enc.encode(deck.md || '') },
    { name: 'style.css', data: enc.encode(deck.css || '') },
  ];
  for (const [name, file] of imgFiles) {
    files.push({ name: `images/${name}`, data: new Uint8Array(await file.arrayBuffer()) });
  }
  const blob = zipStore(files);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(deck.name || 'deck').replace(/[\\/:*?"<>|]/g, '_')}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}
