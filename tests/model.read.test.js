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
