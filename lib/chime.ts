// bishOS notification chime — synthesized at runtime (no audio asset).
// A soft, modern, glassy three-note ascending shimmer with an airy tail.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Resume the audio context on a user gesture so the chime can play later
 * (including from a backgrounded tab). Safe to call repeatedly. */
export function unlockChime() {
  const ac = getCtx();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

const KEY = "bishos.chime.enabled";
export function isChimeEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(KEY) !== "0";
}
export function setChimeEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Play the chime. Pleasant, low-volume, ~0.9s. */
export async function playChime() {
  const ac = getCtx();
  if (!ac) return;
  try {
    if (ac.state === "suspended") await ac.resume();
  } catch {
    return;
  }
  const t0 = ac.currentTime;

  // Soft tone-shaping + an airy feedback-delay tail for a modern shimmer.
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 5200;
  lp.Q.value = 0.4;
  lp.connect(ac.destination);

  const delay = ac.createDelay();
  delay.delayTime.value = 0.17;
  const fb = ac.createGain();
  fb.gain.value = 0.22;
  const wet = ac.createGain();
  wet.gain.value = 0.16;
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(ac.destination);

  // A6 major-ish sparkle: A5 → E6 → A6 (perfect fifth then octave) — bright but soft.
  const notes = [
    { f: 880.0, t: 0.0 },
    { f: 1318.51, t: 0.1 },
    { f: 1760.0, t: 0.2 },
  ];

  for (const n of notes) {
    const start = t0 + n.t;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.16, start + 0.012); // soft fast attack
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.72); // gentle bell decay
    g.connect(lp);
    g.connect(delay);

    const o1 = ac.createOscillator();
    o1.type = "sine";
    o1.frequency.value = n.f;

    const o2 = ac.createOscillator(); // shimmer overtone an octave up
    o2.type = "triangle";
    o2.frequency.value = n.f * 2;
    const o2g = ac.createGain();
    o2g.gain.value = 0.14;

    o1.connect(g);
    o2.connect(o2g);
    o2g.connect(g);

    o1.start(start);
    o2.start(start);
    o1.stop(start + 0.85);
    o2.stop(start + 0.85);
  }
}
