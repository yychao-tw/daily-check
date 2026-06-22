# 每日任務打勾 App・棒球主題 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一個棒球主題的 PWA，讓國小四年級兒子在 iPad 上勾選每天完成的任務，並可編輯每天/每週的任務。

**Architecture:** 純前端 PWA。核心資料邏輯放在無 DOM 的 ES module（`src/model.js`），用 Node 內建 `node --test` 做 TDD；UI 由三個畫面模組（main / editDay / template）組成，`src/app.js` 負責協調與導覽。資料以 localStorage 存於 iPad 本機。離線靠 Service Worker 快取。

**Tech Stack:** 原生 HTML / CSS / JavaScript（ES Modules），無建置工具、無第三方相依。測試用 Node 內建測試框架。部署用 GitHub Pages（免費 https 靜態託管）。

## Global Constraints

- UI 全程繁體中文。
- 完全不使用 emoji（按鈕用文字或棒球風格樣式；箭頭可用 `◀ ▶ ▲ ▼` 等符號）。
- 不需付費、不上架 App Store、不需登入帳號、不做跨裝置同步。
- 目標平台：iPad Safari，加入主畫面後全螢幕、可離線。
- 資料只存 localStorage（key：`baseball-daily-tasks-v1`），與 iCloud 無關。
- 純原生 HTML/CSS/JS，使用 ES Modules，不引入建置工具或第三方套件。
- `package.json` 設 `"type": "module"`，讓瀏覽器與 Node 共用同一份 ES module。
- 範本以星期幾為鍵：`0=星期日 … 6=星期六`。
- 已知日期事實（測試用）：`2026-06-21` 為星期日（weekday 0），`2026-06-22` 為星期一（weekday 1）。

---

### Task 1: 專案骨架與日期工具

**Files:**
- Create: `package.json`
- Create: `src/model.js`
- Test: `tests/model.date.test.js`

**Interfaces:**
- Consumes: 無
- Produces:
  - `createId(): string`
  - `formatDate(date: Date): string`（回傳 `YYYY-MM-DD`）
  - `todayStr(): string`
  - `addDays(dateStr: string, delta: number): string`
  - `getWeekday(dateStr: string): number`（0=日…6=六）
  - `weekdayName(weekday: number): string`
  - `emptyState(): { templates: {0..6: Task[]}, days: {} }`

- [ ] **Step 1: 建立 package.json**

```json
{
  "name": "baseball-daily-tasks",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: 寫失敗測試 `tests/model.date.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, addDays, getWeekday, weekdayName, emptyState } from '../src/model.js';

test('formatDate pads month and day', () => {
  assert.equal(formatDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('addDays crosses month boundary', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('getWeekday maps Sunday and Monday', () => {
  assert.equal(getWeekday('2026-06-21'), 0);
  assert.equal(getWeekday('2026-06-22'), 1);
});

test('weekdayName maps index to Chinese', () => {
  assert.equal(weekdayName(0), '星期日');
  assert.equal(weekdayName(1), '星期一');
});

test('emptyState has 7 empty templates and no days', () => {
  const s = emptyState();
  assert.equal(Object.keys(s.templates).length, 7);
  assert.deepEqual(s.templates[3], []);
  assert.deepEqual(s.days, {});
});
```

- [ ] **Step 3: 執行測試確認失敗**

Run: `node --test tests/model.date.test.js`
Expected: FAIL（`Cannot find module '../src/model.js'` 或函式未定義）

- [ ] **Step 4: 建立 `src/model.js` 最小實作**

```js
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
```

- [ ] **Step 5: 執行測試確認通過**

Run: `node --test tests/model.date.test.js`
Expected: PASS（5 個測試全過）

- [ ] **Step 6: Commit**

```bash
git add package.json src/model.js tests/model.date.test.js
git commit -m "feat: project scaffold and date helpers"
```

---

### Task 2: 讀取邏輯（範本帶出、進度計算）

**Files:**
- Modify: `src/model.js`（追加函式）
- Test: `tests/model.read.test.js`

**Interfaces:**
- Consumes: `emptyState`, `getWeekday`（Task 1）
- Produces:
  - `getTemplate(state, weekday): Task[]`（`Task = {id, title}`，回傳複本）
  - `isDayMaterialized(state, dateStr): boolean`
  - `getDayTasks(state, dateStr): DayTask[]`（`DayTask = {id, title, done}`；未實體化時依星期幾帶出範本且 `done=false`）
  - `countDone(tasks): {done, total}`
  - `isAllDone(tasks): boolean`

- [ ] **Step 1: 寫失敗測試 `tests/model.read.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState, getTemplate, isDayMaterialized, getDayTasks, countDone, isAllDone,
} from '../src/model.js';

function stateWithMondayTemplate() {
  const s = emptyState();
  s.templates[1] = [{ id: 'a', title: '練鋼琴' }, { id: 'b', title: '閱讀' }];
  return s;
}

test('getTemplate returns a copy, not the internal array', () => {
  const s = stateWithMondayTemplate();
  const t = getTemplate(s, 1);
  t.push({ id: 'x', title: 'X' });
  assert.equal(s.templates[1].length, 2);
});

test('getDayTasks derives from weekday template when not materialized', () => {
  const s = stateWithMondayTemplate();
  const tasks = getDayTasks(s, '2026-06-22'); // Monday
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, '練鋼琴');
  assert.equal(tasks[0].done, false);
  assert.equal(isDayMaterialized(s, '2026-06-22'), false);
});

test('getDayTasks uses stored day when materialized', () => {
  const s = stateWithMondayTemplate();
  s.days['2026-06-22'] = [{ id: 'a', title: '練鋼琴', done: true }];
  const tasks = getDayTasks(s, '2026-06-22');
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].done, true);
  assert.equal(isDayMaterialized(s, '2026-06-22'), true);
});

test('countDone and isAllDone', () => {
  assert.deepEqual(countDone([{ done: true }, { done: false }]), { done: 1, total: 2 });
  assert.equal(isAllDone([{ done: true }, { done: false }]), false);
  assert.equal(isAllDone([{ done: true }]), true);
  assert.equal(isAllDone([]), false);
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/model.read.test.js`
Expected: FAIL（函式未定義）

- [ ] **Step 3: 在 `src/model.js` 末端追加實作**

```js
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
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/model.read.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/model.js tests/model.read.test.js
git commit -m "feat: template derivation and progress helpers"
```

---

### Task 3: 單日異動（打勾、新增、刪除、改字、排序）

**Files:**
- Modify: `src/model.js`（追加函式）
- Test: `tests/model.day.test.js`

**Interfaces:**
- Consumes: `getDayTasks`, `isDayMaterialized`, `createId`
- Produces（皆回傳 `state`，必要時先實體化當天）:
  - `materializeDay(state, dateStr): state`
  - `toggleTask(state, dateStr, taskId): state`
  - `addDayTask(state, dateStr, title): state`
  - `removeDayTask(state, dateStr, taskId): state`
  - `editDayTask(state, dateStr, taskId, title): state`
  - `moveDayTask(state, dateStr, taskId, delta): state`（delta = -1 上移 / +1 下移）
  - 內部 helper `moveInArray(arr, id, delta): Array`

- [ ] **Step 1: 寫失敗測試 `tests/model.day.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState, getDayTasks, isDayMaterialized,
  toggleTask, addDayTask, removeDayTask, editDayTask, moveDayTask,
} from '../src/model.js';

function mondayState() {
  const s = emptyState();
  s.templates[1] = [{ id: 'a', title: '練鋼琴' }, { id: 'b', title: '閱讀' }];
  return s;
}

test('toggleTask materializes the day and flips done', () => {
  const s = mondayState();
  toggleTask(s, '2026-06-22', 'a');
  assert.equal(isDayMaterialized(s, '2026-06-22'), true);
  assert.equal(getDayTasks(s, '2026-06-22').find((t) => t.id === 'a').done, true);
  toggleTask(s, '2026-06-22', 'a');
  assert.equal(getDayTasks(s, '2026-06-22').find((t) => t.id === 'a').done, false);
});

test('editing one day does not affect another day with same weekday', () => {
  const s = mondayState();
  addDayTask(s, '2026-06-22', '收玩具'); // this Monday
  const other = getDayTasks(s, '2026-06-29'); // next Monday, untouched
  assert.equal(other.length, 2);
  assert.equal(getDayTasks(s, '2026-06-22').length, 3);
});

test('removeDayTask removes only from that day', () => {
  const s = mondayState();
  removeDayTask(s, '2026-06-22', 'a');
  assert.deepEqual(getDayTasks(s, '2026-06-22').map((t) => t.id), ['b']);
});

test('editDayTask changes the title', () => {
  const s = mondayState();
  editDayTask(s, '2026-06-22', 'a', '練小提琴');
  assert.equal(getDayTasks(s, '2026-06-22')[0].title, '練小提琴');
});

test('moveDayTask reorders within bounds', () => {
  const s = mondayState();
  moveDayTask(s, '2026-06-22', 'b', -1);
  assert.deepEqual(getDayTasks(s, '2026-06-22').map((t) => t.id), ['b', 'a']);
  moveDayTask(s, '2026-06-22', 'b', -1); // already top, no-op
  assert.deepEqual(getDayTasks(s, '2026-06-22').map((t) => t.id), ['b', 'a']);
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/model.day.test.js`
Expected: FAIL（函式未定義）

- [ ] **Step 3: 在 `src/model.js` 末端追加實作**

```js
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
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/model.day.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/model.js tests/model.day.test.js
git commit -m "feat: per-day task mutations with materialization"
```

---

### Task 4: 每週範本異動

**Files:**
- Modify: `src/model.js`（追加函式）
- Test: `tests/model.template.test.js`

**Interfaces:**
- Consumes: `emptyState`, `getTemplate`, `getDayTasks`, `createId`, 內部 `moveInArray`
- Produces（皆回傳 `state`）:
  - `addTemplateTask(state, weekday, title): state`
  - `removeTemplateTask(state, weekday, taskId): state`
  - `editTemplateTask(state, weekday, taskId, title): state`
  - `moveTemplateTask(state, weekday, taskId, delta): state`

- [ ] **Step 1: 寫失敗測試 `tests/model.template.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState, getTemplate, getDayTasks,
  addTemplateTask, removeTemplateTask, editTemplateTask, moveTemplateTask,
  toggleTask,
} from '../src/model.js';

test('addTemplateTask appends to the weekday', () => {
  const s = emptyState();
  addTemplateTask(s, 1, '練鋼琴');
  assert.equal(getTemplate(s, 1).length, 1);
  assert.equal(getTemplate(s, 1)[0].title, '練鋼琴');
});

test('template change affects untouched future days only', () => {
  const s = emptyState();
  addTemplateTask(s, 1, '練鋼琴');
  toggleTask(s, '2026-06-22', getTemplate(s, 1)[0].id); // materialize this Monday
  addTemplateTask(s, 1, '閱讀'); // add to Monday template afterwards
  // already-materialized day is unchanged
  assert.equal(getDayTasks(s, '2026-06-22').length, 1);
  // an untouched Monday reflects the new template
  assert.equal(getDayTasks(s, '2026-06-29').length, 2);
});

test('removeTemplateTask and editTemplateTask', () => {
  const s = emptyState();
  addTemplateTask(s, 2, '游泳');
  const id = getTemplate(s, 2)[0].id;
  editTemplateTask(s, 2, id, '泳課');
  assert.equal(getTemplate(s, 2)[0].title, '泳課');
  removeTemplateTask(s, 2, id);
  assert.equal(getTemplate(s, 2).length, 0);
});

test('moveTemplateTask reorders', () => {
  const s = emptyState();
  addTemplateTask(s, 3, 'A');
  addTemplateTask(s, 3, 'B');
  const bId = getTemplate(s, 3)[1].id;
  moveTemplateTask(s, 3, bId, -1);
  assert.deepEqual(getTemplate(s, 3).map((t) => t.title), ['B', 'A']);
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/model.template.test.js`
Expected: FAIL（函式未定義）

- [ ] **Step 3: 在 `src/model.js` 末端追加實作**

```js
export function addTemplateTask(state, weekday, title) {
  if (!state.templates[weekday]) state.templates[weekday] = [];
  state.templates[weekday].push({ id: createId(), title });
  return state;
}

export function removeTemplateTask(state, weekday, taskId) {
  state.templates[weekday] = (state.templates[weekday] || []).filter((t) => t.id !== taskId);
  return state;
}

export function editTemplateTask(state, weekday, taskId, title) {
  const task = (state.templates[weekday] || []).find((t) => t.id === taskId);
  if (task) task.title = title;
  return state;
}

export function moveTemplateTask(state, weekday, taskId, delta) {
  state.templates[weekday] = moveInArray(state.templates[weekday] || [], taskId, delta);
  return state;
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/model.template.test.js`
Expected: PASS

- [ ] **Step 5: 跑整套測試**

Run: `npm test`
Expected: PASS（所有 model 測試通過）

- [ ] **Step 6: Commit**

```bash
git add src/model.js tests/model.template.test.js
git commit -m "feat: weekly template mutations"
```

---

### Task 5: localStorage 儲存層

**Files:**
- Create: `src/storage.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- Consumes: `emptyState`（Task 1）；瀏覽器全域 `localStorage`
- Produces:
  - `loadState(): state`（無資料或解析失敗時回傳 `emptyState()`，並對結構正規化）
  - `saveState(state): void`

- [ ] **Step 1: 寫失敗測試 `tests/storage.test.js`**

```js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadState, saveState } from '../src/storage.js';
import { emptyState } from '../src/model.js';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
});

test('loadState returns empty state when nothing stored', () => {
  assert.deepEqual(loadState(), emptyState());
});

test('saveState then loadState round-trips', () => {
  const s = emptyState();
  s.templates[1] = [{ id: 'a', title: '練鋼琴' }];
  s.days['2026-06-22'] = [{ id: 'a', title: '練鋼琴', done: true }];
  saveState(s);
  const loaded = loadState();
  assert.equal(loaded.templates[1][0].title, '練鋼琴');
  assert.equal(loaded.days['2026-06-22'][0].done, true);
});

test('loadState recovers from corrupt JSON', () => {
  localStorage.setItem('baseball-daily-tasks-v1', '{not valid json');
  assert.deepEqual(loadState(), emptyState());
});

test('loadState normalizes missing template weekdays', () => {
  localStorage.setItem('baseball-daily-tasks-v1', JSON.stringify({ templates: { 1: [{ id: 'a', title: 'X' }] }, days: {} }));
  const s = loadState();
  assert.equal(Object.keys(s.templates).length, 7);
  assert.deepEqual(s.templates[0], []);
  assert.equal(s.templates[1][0].title, 'X');
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/storage.test.js`
Expected: FAIL（`Cannot find module '../src/storage.js'`）

- [ ] **Step 3: 建立 `src/storage.js`**

```js
// src/storage.js
import { emptyState } from './model.js';

const KEY = 'baseball-daily-tasks-v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return normalize(JSON.parse(raw));
  } catch (e) {
    return emptyState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function normalize(parsed) {
  const base = emptyState();
  if (parsed && parsed.templates) {
    for (const k of Object.keys(base.templates)) {
      base.templates[k] = Array.isArray(parsed.templates[k]) ? parsed.templates[k] : [];
    }
  }
  if (parsed && parsed.days && typeof parsed.days === 'object') {
    base.days = parsed.days;
  }
  return base;
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/storage.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage.js tests/storage.test.js
git commit -m "feat: localStorage persistence layer"
```

---

### Task 6: HTML/CSS 外殼、DOM helper、App 協調器與三個畫面 stub

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/dom.js`
- Create: `src/app.js`
- Create: `src/ui-main.js`（stub）
- Create: `src/ui-editday.js`（stub）
- Create: `src/ui-template.js`（stub）

**Interfaces:**
- Consumes: `loadState`, `saveState`, `todayStr`, `getWeekday`
- Produces:
  - `el(tag, props?, children?): HTMLElement`（DOM helper；`props` 支援 `class`、`text`、`onXxx` 事件、其餘為 attribute）
  - `ctx` 物件：`{ state, currentDate, view, selectedWeekday, save(), setDate(d), setWeekday(w), go(view), render() }`
  - 三個畫面模組各導出 `renderMain(root, ctx)` / `renderEditDay(root, ctx)` / `renderTemplate(root, ctx)`

- [ ] **Step 1: 建立 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="每日任務">
  <title>每日任務・棒球版</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="apple-touch-icon" href="icons/icon-180.png">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 建立 `styles.css`（棒球主題）**

```css
:root {
  --grass: #2e7d32;
  --grass-dark: #1b5e20;
  --dirt: #b9622e;
  --navy: #0b2a4a;
  --white: #ffffff;
  --line: #f4f4f4;
  --red: #c8281e;
  --gray: #b9c2cc;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

html, body {
  margin: 0;
  font-family: "PingFang TC", "Heiti TC", system-ui, sans-serif;
  background: var(--grass-dark);
  color: var(--navy);
  user-select: none;
}

#app { max-width: 760px; margin: 0 auto; min-height: 100vh; background: var(--grass); }

.screen { padding: env(safe-area-inset-top) 16px 32px; }

/* top bar */
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 16px; }
.navbtn {
  font-size: 28px; font-weight: 700; color: var(--white);
  background: var(--navy); border: none; border-radius: 16px;
  width: 64px; height: 64px; cursor: pointer;
}
.navbtn:active { transform: scale(0.94); }
.datebox { text-align: center; color: var(--white); flex: 1; }
.date { font-size: 22px; font-weight: 700; }
.weekday { font-size: 18px; opacity: 0.9; }
.todaybtn {
  display: block; margin: 12px auto 4px; padding: 8px 20px;
  font-size: 16px; color: var(--navy); background: var(--white);
  border: none; border-radius: 999px; cursor: pointer;
}

/* scoreboard */
.scoreboard {
  margin: 16px auto; padding: 10px 18px; width: fit-content;
  background: var(--navy); color: var(--white); border-radius: 12px;
  font-size: 22px; letter-spacing: 2px; display: flex; gap: 12px; align-items: center;
  border: 3px solid #f5d36b;
}
.score-label { font-size: 18px; opacity: 0.85; }
.score-num { font-weight: 800; }

/* diamond / bases */
.diamond { position: relative; width: 160px; height: 160px; margin: 8px auto 20px; transform: rotate(45deg); }
.base { position: absolute; width: 34px; height: 34px; background: var(--gray); border: 3px solid var(--white); }
.base.lit { background: var(--white); box-shadow: 0 0 12px #fff8c2; }
.base1 { bottom: 0; right: 0; }   /* 一壘 */
.base2 { top: 0; right: 0; }      /* 二壘 */
.base3 { top: 0; left: 0; }       /* 三壘 */
.base4 { bottom: 0; left: 0; border-radius: 4px; } /* 本壘 */

/* task cards */
.tasklist { display: flex; flex-direction: column; gap: 14px; }
.card {
  display: flex; align-items: center; gap: 16px;
  background: var(--white); border-radius: 18px; padding: 16px 18px;
  box-shadow: 0 3px 0 rgba(0,0,0,0.18); cursor: pointer; transition: background 0.15s;
}
.card:active { transform: scale(0.99); }
.card.done { background: #d8f3d4; }
.card .title { font-size: 22px; font-weight: 600; }
.card.done .title { color: #2e7d32; text-decoration: line-through; }

.ball {
  position: relative; flex: 0 0 auto;
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--gray); border: 3px solid #9aa6b1;
}
.ball.done {
  background: var(--white); border-color: var(--red);
  background-image:
    radial-gradient(circle at 14px 14px, transparent 16px, var(--red) 17px, transparent 18px),
    radial-gradient(circle at 34px 34px, transparent 16px, var(--red) 17px, transparent 18px);
}
.ball .safe {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: var(--red); transform: rotate(-12deg);
}

.empty { color: var(--white); text-align: center; padding: 28px 12px; font-size: 18px; }

/* footer buttons */
.footer { display: flex; gap: 14px; margin-top: 26px; }
.bigbtn {
  flex: 1; padding: 18px 8px; font-size: 20px; font-weight: 700;
  border: none; border-radius: 16px; cursor: pointer; color: var(--white);
}
.bigbtn.edit { background: var(--dirt); }
.bigbtn.tmpl { background: var(--navy); }
.bigbtn:active { transform: scale(0.97); }

/* edit / template screens */
.editbar { color: var(--white); }
.backbtn { font-size: 18px; color: var(--navy); background: var(--white); border: none; border-radius: 999px; padding: 10px 18px; cursor: pointer; }
.edittitle { color: var(--white); font-size: 20px; font-weight: 700; flex: 1; text-align: center; }

.weektabs { display: flex; gap: 6px; margin: 16px 0; flex-wrap: wrap; justify-content: center; }
.weektab { width: 44px; height: 44px; border-radius: 10px; border: none; background: var(--white); color: var(--navy); font-size: 18px; cursor: pointer; }
.weektab.active { background: var(--dirt); color: var(--white); }

.editlist { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.editrow { display: flex; align-items: center; gap: 8px; background: var(--white); border-radius: 12px; padding: 8px; }
.minibtn { width: 40px; height: 40px; border: none; border-radius: 8px; background: var(--line); font-size: 16px; cursor: pointer; }
.edit-input { flex: 1; font-size: 18px; padding: 10px; border: 2px solid var(--line); border-radius: 8px; min-width: 0; }
.delbtn { border: none; background: var(--red); color: var(--white); border-radius: 8px; padding: 10px 12px; font-size: 16px; cursor: pointer; }
.addrow { display: flex; gap: 8px; margin-top: 14px; }
.addbtn { border: none; background: var(--navy); color: var(--white); border-radius: 10px; padding: 12px 16px; font-size: 18px; cursor: pointer; }
.note { color: var(--white); font-size: 14px; margin-top: 16px; opacity: 0.9; text-align: center; }
```

- [ ] **Step 3: 建立 `src/dom.js`**

```js
// src/dom.js
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v != null) {
      node.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}
```

- [ ] **Step 4: 建立三個畫面 stub**

`src/ui-main.js`:

```js
import { el } from './dom.js';

export function renderMain(root, ctx) {
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'edittitle', text: '主畫面 (stub)' }),
    el('button', { class: 'bigbtn edit', text: '編輯這一天', onClick: () => ctx.go('editDay') }),
    el('button', { class: 'bigbtn tmpl', text: '每週範本', onClick: () => ctx.go('template') }),
  ]));
}
```

`src/ui-editday.js`:

```js
import { el } from './dom.js';

export function renderEditDay(root, ctx) {
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'edittitle', text: '編輯這一天 (stub)' }),
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
  ]));
}
```

`src/ui-template.js`:

```js
import { el } from './dom.js';

export function renderTemplate(root, ctx) {
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'edittitle', text: '每週範本 (stub)' }),
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
  ]));
}
```

- [ ] **Step 5: 建立 `src/app.js` 協調器**

```js
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
```

- [ ] **Step 6: 啟動本機伺服器並手動驗證**

Run: `python3 -m http.server 8000`
然後在桌機瀏覽器開 `http://localhost:8000/`（建議用 DevTools 切到 iPad 尺寸）。
Expected：
- 看到「主畫面 (stub)」與兩顆按鈕。
- 點「編輯這一天」→ 顯示「編輯這一天 (stub)」與「← 完成」。
- 點「← 完成」→ 回到主畫面。
- 點「每週範本」→ 顯示「每週範本 (stub)」，可返回。
驗證後在終端機按 Ctrl+C 停止伺服器。

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css src/dom.js src/app.js src/ui-main.js src/ui-editday.js src/ui-template.js
git commit -m "feat: app shell, dom helper, orchestrator and screen stubs"
```

---

### Task 7: 主畫面（日期切換、打勾、計分板、跑壘）

**Files:**
- Modify: `src/ui-main.js`（以完整版取代 stub）

**Interfaces:**
- Consumes: `el`；`getDayTasks`, `toggleTask`, `countDone`, `weekdayName`, `getWeekday`, `addDays`, `todayStr`
- Produces: 完整 `renderMain(root, ctx)`；點任務卡片會 `toggleTask` → `ctx.save()` → `ctx.render()`

- [ ] **Step 1: 以完整版覆寫 `src/ui-main.js`**

```js
import { el } from './dom.js';
import {
  getDayTasks, toggleTask, countDone,
  weekdayName, getWeekday, addDays, todayStr,
} from './model.js';

export function renderMain(root, ctx) {
  const dateStr = ctx.currentDate;
  const tasks = getDayTasks(ctx.state, dateStr);
  const { done, total } = countDone(tasks);

  const header = el('header', { class: 'topbar' }, [
    el('button', { class: 'navbtn', text: '◀', onClick: () => { ctx.setDate(addDays(dateStr, -1)); ctx.render(); } }),
    el('div', { class: 'datebox' }, [
      el('div', { class: 'date', text: formatHuman(dateStr) }),
      el('div', { class: 'weekday', text: weekdayName(getWeekday(dateStr)) }),
    ]),
    el('button', { class: 'navbtn', text: '▶', onClick: () => { ctx.setDate(addDays(dateStr, 1)); ctx.render(); } }),
  ]);

  const todayBtn = el('button', { class: 'todaybtn', text: '回到今天', onClick: () => { ctx.setDate(todayStr()); ctx.render(); } });

  const scoreboard = el('div', { class: 'scoreboard' }, [
    el('span', { class: 'score-label', text: '完成' }),
    el('span', { class: 'score-num', text: `${done} / ${total}` }),
  ]);

  const diamond = buildDiamond(done, total);

  const list = el('div', { class: 'tasklist' });
  if (tasks.length === 0) {
    list.appendChild(el('div', { class: 'empty', text: '今天還沒有任務，按下方「編輯這一天」新增吧！' }));
  } else {
    for (const t of tasks) {
      list.appendChild(taskCard(t, () => {
        toggleTask(ctx.state, dateStr, t.id);
        ctx.save();
        ctx.render();
      }));
    }
  }

  const footer = el('footer', { class: 'footer' }, [
    el('button', { class: 'bigbtn edit', text: '編輯這一天', onClick: () => ctx.go('editDay') }),
    el('button', { class: 'bigbtn tmpl', text: '每週範本', onClick: () => { ctx.setWeekday(getWeekday(ctx.currentDate)); ctx.go('template'); } }),
  ]);

  root.appendChild(el('div', { class: 'screen main' }, [header, todayBtn, scoreboard, diamond, list, footer]));
}

function taskCard(task, onToggle) {
  const ball = el('div', { class: 'ball' + (task.done ? ' done' : '') });
  if (task.done) ball.appendChild(el('span', { class: 'safe', text: 'SAFE' }));
  return el('div', { class: 'card' + (task.done ? ' done' : ''), onClick: onToggle }, [
    ball,
    el('div', { class: 'title', text: task.title }),
  ]);
}

function buildDiamond(done, total) {
  const bases = 4;
  const reached = total === 0 ? 0 : Math.round((done / total) * bases);
  const wrap = el('div', { class: 'diamond' });
  for (let i = 1; i <= bases; i++) {
    wrap.appendChild(el('div', { class: 'base base' + i + (i <= reached ? ' lit' : '') }));
  }
  return wrap;
}

function formatHuman(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}
```

- [ ] **Step 2: 手動驗證**

Run: `python3 -m http.server 8000`（桌機開 `http://localhost:8000/`）
先用「每週範本」stub 還沒實作，無法新增任務，因此暫時用 DevTools Console 注入測試資料：

```js
localStorage.setItem('baseball-daily-tasks-v1', JSON.stringify({
  templates: { 0:[],1:[{id:'a',title:'練鋼琴'},{id:'b',title:'閱讀'}],2:[],3:[],4:[],5:[],6:[] },
  days: {}
}));
location.reload();
```

Expected（當 `currentDate` 為星期一時）：
- 顯示兩張任務卡片（練鋼琴、閱讀）、計分板「完成 0 / 2」。
- 點一張卡片 → 變綠、棒球變白並出現 SAFE、計分板變「1 / 2」、鑽石有壘包亮起。
- 重新整理頁面 → 打勾狀態保留。
- 按 ◀ / ▶ 可切換日期；切到沒有範本的日子顯示空白提示；「回到今天」可回到今天。
驗證後 Ctrl+C 停止伺服器。
（注意：若今天不是星期一，請按 ◀/▶ 切到星期一查看上述任務。）

- [ ] **Step 3: Commit**

```bash
git add src/ui-main.js
git commit -m "feat: main screen with date nav, check-off, scoreboard and bases"
```

---

### Task 8: 編輯這一天畫面

**Files:**
- Modify: `src/ui-editday.js`（以完整版取代 stub）

**Interfaces:**
- Consumes: `el`；`getDayTasks`, `addDayTask`, `removeDayTask`, `editDayTask`, `moveDayTask`, `weekdayName`, `getWeekday`
- Produces: 完整 `renderEditDay(root, ctx)`，作用對象為 `ctx.currentDate`

- [ ] **Step 1: 以完整版覆寫 `src/ui-editday.js`**

```js
import { el } from './dom.js';
import {
  getDayTasks, addDayTask, removeDayTask, editDayTask, moveDayTask,
  weekdayName, getWeekday,
} from './model.js';

export function renderEditDay(root, ctx) {
  const dateStr = ctx.currentDate;
  const tasks = getDayTasks(ctx.state, dateStr);

  const header = el('header', { class: 'topbar editbar' }, [
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
    el('div', { class: 'edittitle', text: `編輯 ${formatHuman(dateStr)}（${weekdayName(getWeekday(dateStr))}）` }),
  ]);

  const list = el('div', { class: 'editlist' });
  tasks.forEach((t) => {
    const input = el('input', { class: 'edit-input', type: 'text', value: t.title });
    input.value = t.title;
    input.addEventListener('change', () => {
      const v = input.value.trim();
      if (v) { editDayTask(ctx.state, dateStr, t.id, v); ctx.save(); }
    });
    list.appendChild(el('div', { class: 'editrow' }, [
      el('button', { class: 'minibtn', text: '▲', onClick: () => { moveDayTask(ctx.state, dateStr, t.id, -1); ctx.save(); ctx.render(); } }),
      el('button', { class: 'minibtn', text: '▼', onClick: () => { moveDayTask(ctx.state, dateStr, t.id, 1); ctx.save(); ctx.render(); } }),
      input,
      el('button', { class: 'delbtn', text: '刪除', onClick: () => { removeDayTask(ctx.state, dateStr, t.id); ctx.save(); ctx.render(); } }),
    ]));
  });

  const newInput = el('input', { class: 'edit-input', type: 'text', placeholder: '輸入新任務…' });
  const addBtn = el('button', {
    class: 'addbtn', text: '新增任務',
    onClick: () => {
      const title = newInput.value.trim();
      if (title) { addDayTask(ctx.state, dateStr, title); ctx.save(); ctx.render(); }
    },
  });
  const addRow = el('div', { class: 'addrow' }, [newInput, addBtn]);

  const note = el('div', { class: 'note', text: '這裡的修改只影響這一天，不會改到每週範本。' });

  root.appendChild(el('div', { class: 'screen edit' }, [header, list, addRow, note]));
}

function formatHuman(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}/${Number(m)}/${Number(d)}`;
}
```

- [ ] **Step 2: 手動驗證**

Run: `python3 -m http.server 8000`
Expected：
- 主畫面點「編輯這一天」→ 進入編輯畫面，標題顯示目前日期與星期幾。
- 新增任務 → 返回主畫面（先點「← 完成」）可看到新任務。
- 修改任務文字（改完點別處觸發 change）、刪除、▲▼ 排序皆生效且重整後保留。
- 切到另一個日期再編輯，不影響原本日期。
Ctrl+C 停止伺服器。

- [ ] **Step 3: Commit**

```bash
git add src/ui-editday.js
git commit -m "feat: edit-this-day screen"
```

---

### Task 9: 每週範本設定畫面

**Files:**
- Modify: `src/ui-template.js`（以完整版取代 stub）

**Interfaces:**
- Consumes: `el`；`getTemplate`, `addTemplateTask`, `removeTemplateTask`, `editTemplateTask`, `moveTemplateTask`, `weekdayName`
- Produces: 完整 `renderTemplate(root, ctx)`，作用對象為 `ctx.selectedWeekday`

- [ ] **Step 1: 以完整版覆寫 `src/ui-template.js`**

```js
import { el } from './dom.js';
import {
  getTemplate, addTemplateTask, removeTemplateTask, editTemplateTask, moveTemplateTask,
  weekdayName,
} from './model.js';

export function renderTemplate(root, ctx) {
  const w = ctx.selectedWeekday;
  const tasks = getTemplate(ctx.state, w);

  const header = el('header', { class: 'topbar editbar' }, [
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
    el('div', { class: 'edittitle', text: '每週範本' }),
  ]);

  const tabs = el('div', { class: 'weektabs' });
  for (let i = 0; i < 7; i++) {
    tabs.appendChild(el('button', {
      class: 'weektab' + (i === w ? ' active' : ''),
      text: weekdayName(i).replace('星期', ''),
      onClick: () => { ctx.setWeekday(i); ctx.render(); },
    }));
  }

  const list = el('div', { class: 'editlist' });
  tasks.forEach((t) => {
    const input = el('input', { class: 'edit-input', type: 'text', value: t.title });
    input.value = t.title;
    input.addEventListener('change', () => {
      const v = input.value.trim();
      if (v) { editTemplateTask(ctx.state, w, t.id, v); ctx.save(); }
    });
    list.appendChild(el('div', { class: 'editrow' }, [
      el('button', { class: 'minibtn', text: '▲', onClick: () => { moveTemplateTask(ctx.state, w, t.id, -1); ctx.save(); ctx.render(); } }),
      el('button', { class: 'minibtn', text: '▼', onClick: () => { moveTemplateTask(ctx.state, w, t.id, 1); ctx.save(); ctx.render(); } }),
      input,
      el('button', { class: 'delbtn', text: '刪除', onClick: () => { removeTemplateTask(ctx.state, w, t.id); ctx.save(); ctx.render(); } }),
    ]));
  });

  const newInput = el('input', { class: 'edit-input', type: 'text', placeholder: '輸入新任務…' });
  const addBtn = el('button', {
    class: 'addbtn', text: '新增任務',
    onClick: () => {
      const title = newInput.value.trim();
      if (title) { addTemplateTask(ctx.state, w, title); ctx.save(); ctx.render(); }
    },
  });
  const addRow = el('div', { class: 'addrow' }, [newInput, addBtn]);

  const note = el('div', { class: 'note', text: '修改範本只影響「之後尚未被單獨編輯過」的日子。' });

  root.appendChild(el('div', { class: 'screen template' }, [header, tabs, list, addRow, note]));
}
```

- [ ] **Step 2: 手動驗證（含清空既有測試資料）**

Run: `python3 -m http.server 8000`
先在 Console 清空，確保從乾淨狀態測試：

```js
localStorage.removeItem('baseball-daily-tasks-v1');
location.reload();
```

Expected：
- 主畫面點「每週範本」→ 進入範本畫面，預設選到今天的星期幾。
- 上方一～日分頁可切換；各星期幾各自獨立新增/刪除/改字/排序。
- 為「星期一」加幾個任務後返回主畫面，切到任一星期一 → 自動帶出這些任務。
- 回範本把星期一再加一個任務 → 已打過勾的那個星期一不變，未動過的星期一會出現新任務。
Ctrl+C 停止伺服器。

- [ ] **Step 3: Commit**

```bash
git add src/ui-template.js
git commit -m "feat: weekly template editor screen"
```

---

### Task 10: 全壘打完成動畫

**Files:**
- Modify: `src/ui-main.js`（在打勾後偵測全部完成並顯示橫幅）
- Modify: `styles.css`（追加動畫樣式）

**Interfaces:**
- Consumes: `isAllDone`（Task 2）
- Produces: `renderMain` 內新增 `showHomeRun()`，當某次打勾使當天「從未全完成 → 全部完成」時，於 `document.body` 疊一個自動消失的橫幅

- [ ] **Step 1: 在 `src/ui-main.js` 修改 import 行**

把：

```js
import {
  getDayTasks, toggleTask, countDone,
  weekdayName, getWeekday, addDays, todayStr,
} from './model.js';
```

改成：

```js
import {
  getDayTasks, toggleTask, countDone, isAllDone,
  weekdayName, getWeekday, addDays, todayStr,
} from './model.js';
```

- [ ] **Step 2: 在 `src/ui-main.js` 修改打勾的 onToggle 邏輯**

把卡片建立區塊：

```js
    for (const t of tasks) {
      list.appendChild(taskCard(t, () => {
        toggleTask(ctx.state, dateStr, t.id);
        ctx.save();
        ctx.render();
      }));
    }
```

改成：

```js
    for (const t of tasks) {
      list.appendChild(taskCard(t, () => {
        const wasAllDone = isAllDone(getDayTasks(ctx.state, dateStr));
        toggleTask(ctx.state, dateStr, t.id);
        ctx.save();
        const nowAllDone = isAllDone(getDayTasks(ctx.state, dateStr));
        ctx.render();
        if (!wasAllDone && nowAllDone) showHomeRun();
      }));
    }
```

- [ ] **Step 3: 在 `src/ui-main.js` 末端追加 `showHomeRun`**

```js
function showHomeRun() {
  const overlay = el('div', { class: 'homerun-overlay' }, [
    el('div', { class: 'homerun-ball' }),
    el('div', { class: 'homerun-text', text: '全壘打！今天全部完成！' }),
  ]);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2600);
}
```

- [ ] **Step 4: 在 `styles.css` 末端追加動畫樣式**

```css
.homerun-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(11, 42, 74, 0.78); color: #fff;
  animation: hr-fade 2.6s ease forwards;
}
.homerun-text { font-size: 32px; font-weight: 800; letter-spacing: 2px; margin-top: 16px; text-shadow: 0 2px 6px #000; }
.homerun-ball {
  width: 70px; height: 70px; border-radius: 50%;
  background: #fff;
  background-image:
    radial-gradient(circle at 20px 20px, transparent 22px, var(--red) 23px, transparent 25px),
    radial-gradient(circle at 50px 50px, transparent 22px, var(--red) 23px, transparent 25px);
  animation: hr-fly 1.1s ease-out;
}
@keyframes hr-fly {
  0%   { transform: translateY(120px) scale(0.6); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: translateY(-40px) scale(1); opacity: 1; }
}
@keyframes hr-fade {
  0% { opacity: 0; }
  10% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; }
}
```

- [ ] **Step 5: 手動驗證**

Run: `python3 -m http.server 8000`
Expected：把某天所有任務打勾的「最後一勾」完成時，畫面跳出深藍遮罩、棒球飛入、顯示「全壘打！今天全部完成！」，約 2.6 秒後自動消失。再取消一個勾、重新打滿，會再次觸發。
Ctrl+C 停止伺服器。

- [ ] **Step 6: Commit**

```bash
git add src/ui-main.js styles.css
git commit -m "feat: home-run celebration when all tasks done"
```

---

### Task 11: PWA（manifest、Service Worker、圖示、離線）

**Files:**
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Create: `tools/gen-icons.mjs`
- Create: `icons/icon-180.png`, `icons/icon-192.png`, `icons/icon-512.png`（由腳本產生）
- Modify: `src/app.js`（註冊 Service Worker）

**Interfaces:**
- Consumes: 無新邏輯
- Produces: 可安裝、可離線的 PWA

- [ ] **Step 1: 建立 `manifest.webmanifest`**

```json
{
  "name": "每日任務・棒球版",
  "short_name": "每日任務",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0b2a4a",
  "theme_color": "#0b2a4a",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

- [ ] **Step 2: 建立 `service-worker.js`**

```js
const CACHE = 'daily-tasks-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/app.js',
  './src/model.js',
  './src/storage.js',
  './src/dom.js',
  './src/ui-main.js',
  './src/ui-editday.js',
  './src/ui-template.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
```

- [ ] **Step 3: 建立 `tools/gen-icons.mjs`（無相依 PNG 產生器）**

```js
// tools/gen-icons.mjs — generates simple baseball-style PNG icons, no dependencies.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function png(size) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const o = 1 + x * 4;
      if (dist <= r) {
        // white baseball
        row[o] = 255; row[o + 1] = 255; row[o + 2] = 255; row[o + 3] = 255;
        // red seams near left/right edges
        if (dist > r * 0.74 && Math.abs(dx) > r * 0.5) {
          row[o] = 200; row[o + 1] = 30; row[o + 2] = 30;
        }
      } else {
        // navy background
        row[o] = 11; row[o + 1] = 42; row[o + 2] = 74; row[o + 3] = 255;
      }
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const dir = fileURLToPath(new URL('../icons/', import.meta.url));
mkdirSync(dir, { recursive: true });
for (const s of [180, 192, 512]) {
  writeFileSync(new URL(`../icons/icon-${s}.png`, import.meta.url), png(s));
}
console.log('icons generated: 180, 192, 512');
```

- [ ] **Step 4: 產生圖示並驗證為合法 PNG**

Run: `node tools/gen-icons.mjs && file icons/icon-192.png`
Expected: 輸出 `icons generated: 180, 192, 512`，且 `file` 顯示 `PNG image data, 192 x 192`。

- [ ] **Step 5: 在 `src/app.js` 末端追加 Service Worker 註冊**

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
```

- [ ] **Step 6: 手動驗證離線**

Run: `python3 -m http.server 8000`
在桌機（Chrome）開 `http://localhost:8000/`：
- DevTools → Application → Manifest：應顯示名稱「每日任務・棒球版」與圖示。
- DevTools → Application → Service Workers：應顯示已啟用。
- 勾選 DevTools Network 的「Offline」後重新整理 → 頁面仍可正常開啟與操作。
Ctrl+C 停止伺服器。

- [ ] **Step 7: Commit**

```bash
git add manifest.webmanifest service-worker.js tools/gen-icons.mjs icons/ src/app.js
git commit -m "feat: PWA manifest, service worker, icons and offline support"
```

---

### Task 12: 部署到 GitHub Pages 與 iPad 安裝說明

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: 完成的 PWA
- Produces: 線上可存取的 https 網址 + 給家長的 iPad 安裝步驟

- [ ] **Step 1: 建立 `README.md`**

````markdown
# 每日任務・棒球版

給小朋友在 iPad 上勾選每天完成任務的小工具（棒球主題）。純前端 PWA，資料只存裝置本機、免費、不需上架 App Store。

## 本機開發

```bash
npm test                 # 跑邏輯測試
python3 -m http.server 8000   # 本機預覽 http://localhost:8000/
```

## 部署（GitHub Pages，免費）

1. 建立 GitHub 儲存庫並推送本專案。
2. 到 GitHub 儲存庫 → Settings → Pages → Source 選 `Deploy from a branch`，分支選 `main`、資料夾選 `/ (root)`，儲存。
3. 等候約 1 分鐘，取得網址（形如 `https://<帳號>.github.io/<儲存庫名>/`）。

## 在 iPad 上安裝

1. 用 iPad 的 **Safari** 開啟上面的網址。
2. 點底部「分享」鈕 → 選「加入主畫面」。
3. 桌面會出現「每日任務」圖示，點開即為全螢幕 App。
4. 第一次載入後即可離線使用；任務資料只存在這台 iPad（不佔 iCloud 空間）。

## 使用

- 主畫面：用 ◀ ▶ 切換日期、點任務卡片打勾、全部完成會出現「全壘打」。
- 「編輯這一天」：只調整目前顯示那一天的任務。
- 「每週範本」：設定每個星期幾固定的任務；只影響之後尚未被單獨編輯過的日子。
````

- [ ] **Step 2: 初始化遠端並推送（依實際帳號調整）**

```bash
# 用 gh 建立儲存庫並推送（執行者依使用者帳號調整名稱）
gh repo create baseball-daily-tasks --public --source=. --remote=origin --push
```

Expected: 儲存庫建立成功並完成首次推送。
（若使用者偏好私人儲存庫，GitHub Pages 在私人庫需付費方案；本專案不含個資，建議用 public。確認使用者意願後再執行。）

- [ ] **Step 3: 啟用 GitHub Pages 並驗證**

依 README 步驟在 GitHub 網頁啟用 Pages，取得網址後用桌機瀏覽器開啟確認可載入；再於 iPad Safari 實機驗證「加入主畫面 → 離線開啟 → 打勾後重開仍保留」。

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with deployment and iPad install guide"
```

---

## 最終整體驗證

- [ ] 跑全部測試：`npm test` → 全數通過。
- [ ] 本機 `python3 -m http.server` 完整走一遍：範本設定 → 主畫面帶出 → 打勾 → 全壘打 → 編輯單日不影響範本 → 重整持久化 → 離線可用。
- [ ] iPad Safari 實機：加入主畫面、離線、打勾持久化。
