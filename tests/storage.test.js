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
