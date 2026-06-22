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
