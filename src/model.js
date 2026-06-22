// src/model.js
// Pure data logic for the daily task app. No DOM, no localStorage.

export function createId() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr() {
  return formatDate(new Date());
}

export function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return formatDate(d);
}

export function getWeekday(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay();
}

const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function weekdayName(weekday) {
  return WEEKDAY_NAMES[weekday];
}

export function emptyState() {
  return {
    templates: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    days: {},
  };
}

export function getTemplate(state, weekday) {
  return (state.templates[weekday] || []).map((t) => ({ id: t.id, title: t.title }));
}

export function isDayMaterialized(state, dateStr) {
  return Object.prototype.hasOwnProperty.call(state.days, dateStr);
}

export function getDayTasks(state, dateStr) {
  if (isDayMaterialized(state, dateStr)) {
    return state.days[dateStr].map((t) => ({ id: t.id, title: t.title, done: t.done }));
  }
  const weekday = getWeekday(dateStr);
  return getTemplate(state, weekday).map((t) => ({ id: t.id, title: t.title, done: false }));
}

export function countDone(tasks) {
  return { done: tasks.filter((t) => t.done).length, total: tasks.length };
}

export function isAllDone(tasks) {
  return tasks.length > 0 && tasks.every((t) => t.done);
}

function moveInArray(arr, id, delta) {
  const i = arr.findIndex((t) => t.id === id);
  if (i === -1) return arr;
  const j = i + delta;
  if (j < 0 || j >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(i, 1);
  copy.splice(j, 0, item);
  return copy;
}

export function materializeDay(state, dateStr) {
  if (!isDayMaterialized(state, dateStr)) {
    state.days[dateStr] = getDayTasks(state, dateStr);
  }
  return state;
}

export function toggleTask(state, dateStr, taskId) {
  materializeDay(state, dateStr);
  const task = state.days[dateStr].find((t) => t.id === taskId);
  if (task) task.done = !task.done;
  return state;
}

export function addDayTask(state, dateStr, title) {
  materializeDay(state, dateStr);
  state.days[dateStr].push({ id: createId(), title, done: false });
  return state;
}

export function removeDayTask(state, dateStr, taskId) {
  materializeDay(state, dateStr);
  state.days[dateStr] = state.days[dateStr].filter((t) => t.id !== taskId);
  return state;
}

export function editDayTask(state, dateStr, taskId, title) {
  materializeDay(state, dateStr);
  const task = state.days[dateStr].find((t) => t.id === taskId);
  if (task) task.title = title;
  return state;
}

export function moveDayTask(state, dateStr, taskId, delta) {
  materializeDay(state, dateStr);
  state.days[dateStr] = moveInArray(state.days[dateStr], taskId, delta);
  return state;
}
