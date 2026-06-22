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
