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
  const now = ac.currentTime;

  // Noise transient (the "crack").
  const dur = 0.12;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1100;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600;
  bp.Q.value = 0.8;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.9, now + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

  noise.connect(hp).connect(bp).connect(noiseGain).connect(ac.destination);

  // Woody body thump.
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.5, now + 0.004);
  oscGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);
  osc.connect(oscGain).connect(ac.destination);

  noise.start(now);
  noise.stop(now + dur);
  osc.start(now);
  osc.stop(now + 0.13);
}

// A celebratory ascending fanfare for finishing every task ("home run").
export function playHomeRun() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
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
