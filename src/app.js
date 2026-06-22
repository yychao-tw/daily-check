// src/app.js
import { loadState, saveState } from './storage.js';
import { todayStr, getWeekday } from './model.js';
import { parseTemplatesFromHash } from './share.js';
import { preloadSamples } from './sound.js';
import { renderMain } from './ui-main.js';
import { renderEditDay } from './ui-editday.js';
import { renderTemplate } from './ui-template.js';

const ctx = {
  state: loadState(),
  currentDate: todayStr(),
  view: 'main',
  selectedWeekday: getWeekday(todayStr()),
  save() { saveState(this.state); },
  setDate(d) { this.currentDate = d; },
  setWeekday(w) { this.selectedWeekday = w; },
  go(view) { this.view = view; this.render(); },
  render() { render(); },
};

maybeImportTemplatesFromHash();

function maybeImportTemplatesFromHash() {
  let imported = null;
  try {
    imported = parseTemplatesFromHash(location.hash);
  } catch (_e) {
    imported = null;
  }
  if (!imported) return;
  // Always clear the hash so a reload won't re-prompt.
  try { history.replaceState(null, '', location.pathname + location.search); } catch (_e) { location.hash = ''; }
  const ok = window.confirm('要用這份範本覆蓋目前的每週範本嗎？（不會影響已打勾的紀錄）');
  if (!ok) return;
  ctx.state.templates = imported;
  ctx.save();
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  if (ctx.view === 'editDay') renderEditDay(root, ctx);
  else if (ctx.view === 'template') renderTemplate(root, ctx);
  else renderMain(root, ctx);
}

render();

preloadSamples();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
