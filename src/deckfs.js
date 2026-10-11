/* ============================================================
   deckfs.js — decks sur disque : un deck = UN FICHIER .mdk
   ------------------------------------------------------------
   • Cache navigateur : le deck en cours vit dans le store
     (localStorage, cf. store.js) — copie de travail permanente.
   • Disque : « Enregistrer » / « Enregistrer sous » écrivent un
     fichier <nom-du-deck>.mdk — une archive ZIP contenant toute
     l'arborescence du projet :
         mydeck.json     manifeste (version du format deck)
         deck.md         contenu Markdown
         style.css       style du deck
         images/         images et SVG référencés
         versions/       versions antérieures de deck.md
   • « Ouvrir » lit un .mdk et restaure le deck dans le cache.
   ============================================================ */

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
const MAX_VERSIONS = 10;

/* Version du format deck (compatibilité) — incrémenter lors d'un
   changement de structure de l'archive .mdk. */
export const DECK_FORMAT = '1.1';

/* ---------- images en mémoire (issues du .mdk ouvert) ---------- */

const imgFiles = new Map();     // nom de fichier -> File
const imgUrls = new Map();      // nom de fichier -> objectURL

function setImages(files) { // files : Map name -> Blob
  for (const url of imgUrls.values()) URL.revokeObjectURL(url);
  imgFiles.clear();
  imgUrls.clear();
  for (const [name, blob] of files) {
    imgFiles.set(name, new File([blob], name, { type: blob.type }));
    imgUrls.set(name, URL.createObjectURL(blob));
  }
}

/** Réécrit les src="images/…" d'un conteneur rendu vers les objets URL du deck courant. */
export function applyDeckImages(container) {
  container.querySelectorAll('img[src]').forEach((img) => {
    const m = img.getAttribute('src').match(/^(?:\.\/)?images\/(.+)$/);
    if (m && imgUrls.has(m[1])) img.src = imgUrls.get(m[1]);
  });
}

/* ---------- état de session ---------- */

let versions = [];              // [{ name, md }] — versions antérieures de deck.md
let lastSavedMd = null;         // dernier deck.md écrit sur disque (pour l'archivage)
let saveHandle = null;          // FileSystemFileHandle du deck courant (.mdk)
let saveDeckId = null;          // ID du deck auquel saveHandle appartient

export const hasSaveHandle = () => !!saveHandle;
export const saveHandleName = () => (saveHandle ? saveHandle.name : null);

/** Nom du fichier .mdk lié à un deck (sans demander de permission), ou null. */
export async function getLinkedFileName(deckId) {
  if (!deckId) return null;
  if (saveHandle && saveDeckId === deckId) return saveHandle.name;
  try {
    const h = await idbGet('save:' + deckId);
    return h?.name ?? null;
  } catch { return null; }
}

/* ---------- dossier des decks (bibliothèque) ----------
   Choisi UNE fois ; tous les « Enregistrer » y écrivent
   directement <nom du deck>.mdk, sans jamais rouvrir l'explorateur. */

let libHandle = null;   // FileSystemDirectoryHandle du dossier des decks

/** Change de dossier des decks (re-choix explicite par l'utilisateur). */
export async function changeLibrary() {
  const h = await chooseLibrary();
  return h ? h.name : null;
}

/** Liste les fichiers .mdk présents dans le dossier des decks (retour de visibilité). */
export async function listLibraryMdk() {
  const lib = await ensureLibrary();
  if (!lib) return null;
  const names = [];
  for await (const [name, handle] of lib.entries()) {
    if (handle.kind === 'file' && /\.mdk$/i.test(name)) names.push(name);
  }
  names.sort();
  return names;
}

export async function getLibraryName() {
  if (libHandle) return libHandle.name;
  try { const h = await idbGet('library'); return h?.name ?? null; } catch { return null; }
}

async function ensureLibrary() {
  if (libHandle) return libHandle;
  try {
    const h = await idbGet('library');
    if (!h) return null;
    if (typeof h.queryPermission === 'function') {
      let p = await h.queryPermission({ mode: 'readwrite' });
      if (p !== 'granted' && h.requestPermission) {
        p = await h.requestPermission({ mode: 'readwrite' });   // demandée au clic : activation utilisateur
      }
      if (p !== 'granted') return null;
    }
    libHandle = h;
    return h;
  } catch { return null; }
}

async function chooseLibrary() {
  if (!('showDirectoryPicker' in window)) return null;
  try {
    const h = await window.showDirectoryPicker({ id: 'mydeck-library', mode: 'readwrite' });
    await idbSet('library', h);
    libHandle = h;
    return h;
  } catch (e) {
    if (e.name === 'AbortError') return null;
    throw e;
  }
}

/* ---------- persistance du handle fichier (IndexedDB) ----------
   Le handle .mdk est mémorisé par ID de deck : « Enregistrer » écrit
   directement à l'endroit en cours, y compris après rechargement
   (permission ré-accordée silencieusement par le navigateur si
   l'utilisateur a coché « autoriser à chaque fois » ou déjà validé). */

const IDB_NAME = 'mydeck';
const IDB_STORE = 'handles';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const r = tx.objectStore(IDB_STORE).get(key);
    r.onsuccess = () => resolve(r.result ?? null);
    r.onerror = () => reject(r.error);
  });
}

export async function rememberSaveHandle(deckId, handle) {
  if (!deckId || !handle) return;
  saveHandle = handle;
  saveDeckId = deckId;
  try { await idbSet('save:' + deckId, handle); } catch { /* IndexedDB indisponible : session seulement */ }
}

/** Restaure le handle .mdk mémorisé pour ce deck (à l'entrée dans la page Création). */
export async function restoreSaveHandle(deckId) {
  if (!deckId) return;
  if (saveHandle && saveDeckId === deckId) return;
  saveHandle = null;
  saveDeckId = null;
  try {
    const h = await idbGet('save:' + deckId);
    if (h) { saveHandle = h; saveDeckId = deckId; }
  } catch { /* IndexedDB indisponible : pas de restauration */ }
}

/* ---------- gestion des versions du deck.md ---------- */

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

/** À l'écriture d'un .mdk : archive l'ancien deck.md dans versions/ si le contenu a changé. */
function archivePreviousMd(nextMd) {
  if (lastSavedMd !== null && lastSavedMd !== nextMd) {
    versions = [...versions.filter((v) => v.md !== lastSavedMd), { name: `deck-${stamp()}.md`, md: lastSavedMd }];
    versions.sort((a, b) => a.name.localeCompare(b.name));
    versions = versions.slice(-MAX_VERSIONS);
  }
}

/** Compare une version de format deck "1.2" à la version supportée. */
export function isFormatSupported(v) {
  if (!v) return true; // archive sans manifeste (première génération)
  const cur = DECK_FORMAT.split('.').map(Number);
  const got = String(v).split('.').map(Number);
  return (got[0] || 0) < cur[0] || ((got[0] || 0) === cur[0] && (got[1] || 0) <= cur[1]);
}

/* ============================================================
   ZIP — écriture (méthode « store », sans dépendance)
   ============================================================ */

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
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);          // méthode 0 : store
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
    dv.setUint16(10, 0, true);
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

/* ============================================================
   ZIP — lecture (store + deflate via DecompressionStream)
   ============================================================ */

async function inflateRaw(u8) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([u8]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(buf) { // buf : ArrayBuffer → Map nom -> Uint8Array
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  /* EOCD : signature 0x06054b50 dans les derniers 65 579 octets */
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Fichier .mdk invalide (fin d\'archive introuvable).');
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(off, true) !== 0x02014b50) throw new Error('Archive .mdk corrompue.');
    const method = dv.getUint16(off + 10, true);
    const compSize = dv.getUint32(off + 20, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLenC = dv.getUint16(off + 30, true);
    const commLenC = dv.getUint16(off + 32, true);
    const localOff = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u8.slice(off + 46, off + 46 + nameLen));
    /* en-tête local : données après fixed 30 + nom + extra */
    const lNameLen = dv.getUint16(localOff + 26, true);
    const lExtraLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    let data = u8.slice(dataStart, dataStart + compSize);
    if (method === 8) data = await inflateRaw(data);
    else if (method !== 0) throw new Error(`Méthode de compression non supportée (${method}) pour ${name}.`);
    if (!name.endsWith('/')) out.set(name, data);
    off += 46 + nameLen + extraLenC + commLenC;
  }
  return out;
}

/* ============================================================
   Enregistrement .mdk
   ============================================================ */

const safeName = (n) => (n || 'deck').replace(/[\\/:*?"<>|]/g, '_').replace(/\.mdk$/i, '');

/** Construit l'archive .mdk complète du deck (arborescence + versions). */
async function buildMdkBlob(deck) {
  const enc = new TextEncoder();
  archivePreviousMd(deck.md || '');
  const files = [
    { name: 'mydeck.json', data: enc.encode(JSON.stringify({ format: DECK_FORMAT, name: deck.name || safeName(deck.name), savedAt: new Date().toISOString() }, null, 2) + '\n') },
    { name: 'deck.md', data: enc.encode(deck.md || '') },
    { name: 'style.css', data: enc.encode(deck.css || '') },
  ];
  for (const [name, file] of imgFiles) {
    files.push({ name: `images/${name}`, data: new Uint8Array(await file.arrayBuffer()) });
  }
  for (const v of versions) {
    files.push({ name: `versions/${v.name}`, data: enc.encode(v.md) });
  }
  lastSavedMd = deck.md || '';
  return zipStore(files);
}

/** Enregistrer sous : choisit l'emplacement (showSaveFilePicker si dispo, sinon téléchargement). */
export async function saveDeckAs(deck) {
  const blob = await buildMdkBlob(deck);
  const filename = `${safeName(deck.name)}.mdk`;
  if ('showSaveFilePicker' in window) {
    try {
      const h = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Deck myDeck (.mdk)', accept: { 'application/zip': ['.mdk'] } }],
      });
      await rememberSaveHandle(deck.id, h);
      const w = await h.createWritable();
      await w.write(blob);
      await w.close();
      return { filename: h.name, where: 'picker' };
    } catch (e) {
      if (e.name === 'AbortError') return { cancelled: true };
      throw e;
    }
  }
  downloadBlob(blob, filename);
  return { filename, where: 'download' };
}

/** Enregistrer : réutilise l'emplacement en cours (handle mémorisé pour ce deck). */
export async function saveDeck(deck) {
  /* 1) Fichier .mdk spécifique lié à ce deck (issu d'« Ouvrir » ou « Enregistrer sous »). */
  if (!saveHandle || saveDeckId !== deck.id) await restoreSaveHandle(deck.id);
  if (saveHandle) {
    const blob = await buildMdkBlob(deck);
    try {
      if (typeof saveHandle.queryPermission === 'function'
          && await saveHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        const perm = saveHandle.requestPermission
          ? await saveHandle.requestPermission({ mode: 'readwrite' })
          : 'granted';
        if (perm !== 'granted') { saveHandle = null; saveDeckId = null; /* → dossier des decks */ }
      }
      if (saveHandle) {
        const w = await saveHandle.createWritable();
        await w.write(blob);
        await w.close();
        return { filename: saveHandle.name, where: 'handle' };
      }
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'NotFoundError') {
        saveHandle = null; saveDeckId = null;   // → dossier des decks
      } else throw e;
    }
  }

  /* 2) Dossier des decks : écriture directe — aucun sélecteur une fois le dossier choisi. */
  let lib = await ensureLibrary();
  if (!lib && !('showDirectoryPicker' in window)) {
    /* Repli : File System Access API indisponible (Firefox, Safari...) -> telechargement du .mdk. */
    const blob = await buildMdkBlob(deck);
    const filename = `${safeName(deck.name)}.mdk`;
    downloadBlob(blob, filename);
    return { filename, where: 'download' };
  }
  if (!lib) lib = await chooseLibrary();
  if (!lib) return { cancelled: true };

  const blob = await buildMdkBlob(deck);
  const filename = `${safeName(deck.name)}.mdk`;
  try {
    const fh = await lib.getFileHandle(filename, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
    return { filename, where: 'library', folder: lib.name };
  } catch (e) {
    if (e.name === 'NotAllowedError') { libHandle = null; return { cancelled: true, reason: 'permission-refusée' }; }
    throw e;
  }
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ============================================================
   Ouverture .mdk
   ============================================================ */

async function pickMdkFile() {
  if ('showOpenFilePicker' in window) {
    try {
      const [fh] = await window.showOpenFilePicker({
        types: [{ description: 'Deck myDeck (.mdk)', accept: { 'application/zip': ['.mdk'] } }],
        multiple: false,
      });
      return { file: await fh.getFile(), handle: fh };
    } catch (e) {
      if (e.name === 'AbortError') return null;
      throw e;
    }
  }
  /* Repli : sélecteur de fichier classique (pas de handle) */
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mdk,application/zip';
    input.onchange = () => resolve(input.files[0] ? { file: input.files[0], handle: null } : null);
    input.click();
  });
}

/** Ouvre un fichier .mdk, restaure le deck dans le cache et retourne ses données. */
export async function openDeck() {
  const picked = await pickMdkFile();
  if (!picked) return null;
  const { file, handle } = picked;
  const entries = await unzip(await file.arrayBuffer());
  const dec = (n) => (entries.has(n) ? new TextDecoder().decode(entries.get(n)) : '');
  let meta = null;
  try { meta = JSON.parse(dec('mydeck.json')); } catch { meta = null; }
  const format = meta?.format ?? null;
  const md = dec('deck.md');
  const css = dec('style.css');
  /* Images */
  const images = new Map();
  for (const [name, data] of entries) {
    const m = name.match(/^images\/(.+)$/);
    if (m && IMG_EXT.test(m[1])) {
      const ext = m[1].split('.').pop().toLowerCase();
      images.set(m[1], new Blob([data], { type: `image/${ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext}` }));
    }
  }
  setImages(images);
  /* Versions archivées */
  versions = [];
  for (const [name, data] of entries) {
    const m = name.match(/^versions\/(deck-.+\.md)$/);
    if (m) versions.push({ name: m[1], md: new TextDecoder().decode(data) });
  }
  versions.sort((a, b) => a.name.localeCompare(b.name));
  versions = versions.slice(-MAX_VERSIONS);
  lastSavedMd = md;
  const deckName = file.name.replace(/\.mdk$/i, '') || meta?.name || 'Deck';
  return { name: deckName, md, css, format, handle };
}

/* ============================================================
   Export ZIP (archive lisible, distincte du .mdk)
   ============================================================ */

export async function exportZip(deck) {
  const blob = await buildMdkBlob(deck);
  downloadBlob(blob, `${safeName(deck.name)}.zip`);
  return { filename: `${safeName(deck.name)}.zip` };
}
