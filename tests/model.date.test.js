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
