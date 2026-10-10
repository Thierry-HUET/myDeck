/* ============================================================
   md2slides.js — Markdown → slides
   ============================================================ */
import { marked } from 'marked';

export const md2html = (md) => marked.parse(md);

export function splitSlides(md) {
  return md
    .split(/(?:\r?\n|^)[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*(?=\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Rend une slide dans un élément .slide */
export function renderSlideInto(el, md) {
  el.innerHTML = md2html(md);
  el.classList.toggle('title-slide', /^#\s/m.test(md));
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
