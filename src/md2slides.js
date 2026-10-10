/* ============================================================
   md2slides.js — Markdown → slides
   ------------------------------------------------------------
   Templates : une slide peut être préfixée d'un bloc
       ::{nom-du-template}
       …contenu Markdown…
       ::
   Le rendu applique les classes `tpl tpl-<nom>` à l'élément .slide.

   Mise en forme ciblée (inspiré de MyST, sans HTML) :
   • Rôles inline    : {accent}`mot`, {warn}`mot`, {color=#f59e0b}`mot`
   • Directives bloc : ```{highlight}
                         paragraphe mis en avant
                       ```
   ============================================================ */
import { marked } from 'marked';

/* ---------- rôles inline & directives (pré-traitement) ---------- */

/* {role}`contenu` ou {role=valeur}`contenu` — hors blocs de code */
const INLINE_ROLE = /\{([\w-]+)(?:=([#\w][^`}]*))?\}`([^`]*)`/g;

/* Bloc directive ```{nom}\n…\n``` (contrairement aux blocs de code, {nom} suit ``` ) */
const DIRECTIVE = /(^|\n)([ \t]*)```\{([\w-]+)\}[ \t]*\n([\s\S]*?)\n```\s*(?=\n|$)/g;

function applyDirectives(src) {
  return src.replace(DIRECTIVE, (m, nl, indent, name, body) => {
    /* le corps de la directive est rendu comme Markdown inline */
    const inner = marked.parseInline(body.trim());
    return `${nl}${indent}<p class="dir-${name}">${inner}</p>`;
  });
}

function applyInlineRoles(src) {
  /* protéger les blocs de code ``` … ``` et ~~~ … ~~~ */
  const parts = src.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : part.replace(INLINE_ROLE, (m, role, arg, content) => {
      if (role === 'color') return `<span style="color:${arg}">${content}</span>`;
      if (role === 'mark') return `<mark>${content}</mark>`;
      return `<span class="role-${role}">${content}</span>`;
    })))
    .join('');
}

export const md2html = (md) => marked.parse(applyInlineRoles(applyDirectives(md)));

/* ---------- templates de slides ---------- */

/* Bloc template en tête de slide : ::{nom}\n contenu \n:: */
const TPL_RE = /^\s*::\{([\w-]+)\}[ \t]*\r?\n([\s\S]*?)\r?\n?::\s*$/;

/** Extrait { tpl, md } d'une slide : tpl = nom du template ou null. */
export function parseSlide(md) {
  const m = md.match(TPL_RE);
  return m ? { tpl: m[1], md: m[2].trim() } : { tpl: null, md: md.trim() };
}

export function splitSlides(md) {
  return md
    .split(/(?:\r?\n|^)[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*(?=\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Rend une slide dans un élément .slide (gère les templates) */
export function renderSlideInto(el, md) {
  const { tpl, md: body } = parseSlide(md);
  el.innerHTML = md2html(body);
  /* Réinitialise les classes de template, conserve .slide */
  for (const c of [...el.classList]) {
    if (c === 'title-slide' || c === 'tpl' || c.startsWith('tpl-')) el.classList.remove(c);
  }
  if (tpl) {
    el.classList.add('tpl', `tpl-${tpl}`);
    if (tpl === 'title') el.classList.add('title-slide');   // compat style v0.1
  } else {
    el.classList.toggle('title-slide', /^#\s/m.test(body));  // heuristique historique
  }
}

/** Injecte le CSS du deck dans un conteneur (idempotent) */
export function applyDeckCss(container, css) {
  if (!css) return;
  let s = container.querySelector('style[data-deck-css]');
  if (!s) {
    s = document.createElement('style');
    s.dataset.deckCss = '';
    container.appendChild(s);
  }
  s.textContent = css;
}
