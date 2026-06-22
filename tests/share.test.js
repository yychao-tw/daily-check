import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeTemplates, decodeTemplates, buildShareUrl, parseTemplatesFromHash } from '../src/share.js';

function sampleTemplates() {
  return {
    0: [],
    1: [{ id: 'a', title: '練鋼琴' }, { id: 'b', title: '閱讀' }],
    2: [{ id: 'c', title: '游泳課' }],
    3: [], 4: [], 5: [], 6: [],
  };
}

test('encode then decode round-trips templates with unicode', () => {
  const t = sampleTemplates();
  const decoded = decodeTemplates(encodeTemplates(t));
  assert.deepEqual(decoded[1], [{ id: 'a', title: '練鋼琴' }, { id: 'b', title: '閱讀' }]);
  assert.deepEqual(decoded[2], [{ id: 'c', title: '游泳課' }]);
  assert.deepEqual(decoded[0], []);
});

test('decoded templates always have all 7 weekday keys as arrays', () => {
  const decoded = decodeTemplates(encodeTemplates({ 1: [{ id: 'a', title: 'X' }] }));
  assert.equal(Object.keys(decoded).length, 7);
  for (let i = 0; i < 7; i++) assert.ok(Array.isArray(decoded[i]));
  assert.equal(decoded[1][0].title, 'X');
});

test('decode drops malformed tasks and coerces fields to strings', () => {
  const enc = encodeTemplates({ 1: [{ id: 'a', title: '好' }, { title: 'no id ok' }, 'junk', { id: 'b' }] });
  const decoded = decodeTemplates(enc);
  const titles = decoded[1].map((x) => x.title);
  assert.ok(titles.includes('好'));
  assert.ok(titles.includes('no id ok'));
  assert.ok(!titles.includes('junk'));
  for (const item of decoded[1]) {
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.title, 'string');
    assert.ok(item.id.length > 0);
  }
});

test('decodeTemplates returns null on garbage input', () => {
  assert.equal(decodeTemplates('not valid base64 @@@'), null);
  assert.equal(decodeTemplates(''), null);
  assert.equal(decodeTemplates('%%%'), null);
});

test('encoded string is URL-hash safe (no +, /, = or spaces)', () => {
  const enc = encodeTemplates(sampleTemplates());
  assert.ok(!/[+/=\s]/.test(enc));
});

test('buildShareUrl embeds encoded templates under #tpl=', () => {
  const url = buildShareUrl(sampleTemplates(), 'https://example.com/daily-check/');
  assert.ok(url.startsWith('https://example.com/daily-check/#tpl='));
  const fromUrl = parseTemplatesFromHash(new URL(url).hash);
  assert.deepEqual(fromUrl[1], [{ id: 'a', title: '練鋼琴' }, { id: 'b', title: '閱讀' }]);
});

test('parseTemplatesFromHash returns null when no tpl param present', () => {
  assert.equal(parseTemplatesFromHash(''), null);
  assert.equal(parseTemplatesFromHash('#other=1'), null);
});
