// src/app.js
import { loadState, saveState } from './storage.js';
import { todayStr, getWeekday } from './model.js';
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

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  if (ctx.view === 'editDay') renderEditDay(root, ctx);
  else if (ctx.view === 'template') renderTemplate(root, ctx);
  else renderMain(root, ctx);
}

render();
