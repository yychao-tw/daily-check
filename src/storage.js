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
