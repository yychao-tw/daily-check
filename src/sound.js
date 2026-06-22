// src/sound.js
// Synthesized sound effects via the Web Audio API. No audio files, works
// offline, no copyright concerns. All functions are safe no-ops when the
// Web Audio API is unavailable (e.g. under Node) or when muted.

const MUTE_KEY = 'baseball-daily-tasks-muted';

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch (_e) { return null; }
  }
  // iOS suspends the context until a user gesture; resume on demand.
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (_e) { return false; }
}

export function setMuted(muted) {
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_e) { /* ignore */ }
}

export function toggleMute() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// A short, sharp "bat hitting the ball" crack: a noise transient plus a brief
// woody thump.
export function playHit() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    playHitImpl(ac);
  } catch (_e) { /* never let a sound glitch disrupt the tap handler */ }
}

function playHitImpl(ac) {
  const now = ac.currentTime;

  // 1) Sharp contact transient — a very short bright noise burst (the "tink").
  const nDur = 0.05;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * nDur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.4, now + 0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.0006, now + nDur);
  noise.connect(hp).connect(noiseGain).connect(ac.destination);

  // 2) Bright metallic ring — a few inharmonic high partials that ring out,
  //    giving the characteristic aluminium-bat "PING".
  const ring = 0.26;
  const partials = [
    { f: 2700, g: 0.38 },
    { f: 4300, g: 0.24 },
    { f: 5900, g: 0.15 },
    { f: 8200, g: 0.08 },
  ];
  for (const { f, g } of partials) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    // tiny downward pitch glide sharpens the metallic attack
    osc.frequency.setValueAtTime(f * 1.04, now);
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.05);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime(g, now + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0004, now + ring);
    osc.connect(og).connect(ac.destination);
    osc.start(now);
    osc.stop(now + ring + 0.02);
  }

  noise.start(now);
  noise.stop(now + nDur);
}

// A celebratory ascending fanfare for finishing every task ("home run").
export function playHomeRun() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    playHomeRunImpl(ac);
  } catch (_e) { /* never let a sound glitch disrupt the tap handler */ }
}

function playHomeRunImpl(ac) {
  const now = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const t = now + i * 0.13;
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  });
  // Final shimmer on the top note.
  const tEnd = now + notes.length * 0.13;
  const shimmer = ac.createOscillator();
  shimmer.type = 'triangle';
  shimmer.frequency.setValueAtTime(1046.5, tEnd);
  shimmer.frequency.exponentialRampToValueAtTime(1567.98, tEnd + 0.3); // up to G6
  const sg = ac.createGain();
  sg.gain.setValueAtTime(0.0001, tEnd);
  sg.gain.exponentialRampToValueAtTime(0.22, tEnd + 0.03);
  sg.gain.exponentialRampToValueAtTime(0.0006, tEnd + 0.5);
  shimmer.connect(sg).connect(ac.destination);
  shimmer.start(tEnd);
  shimmer.stop(tEnd + 0.52);
}
