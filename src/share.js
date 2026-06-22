// src/share.js
// Encode/decode the weekly templates into a URL-hash-safe string so a parent
// can move templates from one device to another via a shared link. Pure
// functions, no DOM. Works in both browser and Node (uses global btoa/atob,
// TextEncoder/TextDecoder).

function toBase64Url(str) {
  const utf8 = new TextEncoder().encode(str);
  let bin = '';
  for (const b of utf8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function normalizeTemplates(parsed) {
  const out = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  if (!parsed || typeof parsed !== 'object') return out;
  for (let i = 0; i < 7; i++) {
    const arr = parsed[i];
    if (!Array.isArray(arr)) continue;
    out[i] = arr
      .filter((t) => t && typeof t === 'object')
      .map((t) => ({
        id: t.id != null && String(t.id).length > 0 ? String(t.id) : 'id-' + Math.random().toString(36).slice(2, 10),
        title: t.title != null ? String(t.title) : '',
      }))
      .filter((t) => t.title.length > 0);
  }
  return out;
}

export function encodeTemplates(templates) {
  const slim = {};
  for (let i = 0; i < 7; i++) {
    slim[i] = (templates && Array.isArray(templates[i]) ? templates[i] : []).map((t) => ({ id: t.id, title: t.title }));
  }
  return toBase64Url(JSON.stringify(slim));
}

export function decodeTemplates(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0) return null;
  try {
    const json = fromBase64Url(encoded);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeTemplates(parsed);
  } catch (_e) {
    return null;
  }
}

export function buildShareUrl(templates, baseUrl) {
  const base = baseUrl.split('#')[0];
  return base + '#tpl=' + encodeTemplates(templates);
}

export function parseTemplatesFromHash(hash) {
  if (typeof hash !== 'string') return null;
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  const enc = params.get('tpl');
  if (!enc) return null;
  return decodeTemplates(enc);
}
