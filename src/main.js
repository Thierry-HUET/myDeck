import './styles/global.css';
import './styles/slides.css';
import { ensureSample, applyTheme } from './store.js';

const routes = { '': 'view', 'create': 'create', 'settings': 'settings' };
const app = document.getElementById('app');
let cleanup = null;

async function render() {
  if (typeof cleanup === 'function') { cleanup(); cleanup = null; }
  applyTheme();
  const hash = location.hash.replace(/^#\/?/, '');
  const page = routes[hash] ?? 'view';
  const mod = await import(`./pages/page-${page}.js`);
  app.innerHTML = '';
  cleanup = mod.mount(app) || null;
}

window.addEventListener('hashchange', render);

(async () => {
  await ensureSample();
  await render();
})();
