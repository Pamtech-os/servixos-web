// Notification sounds, synthesized with the Web Audio API so no audio files ship with the app.
// Browsers keep audio locked until the user interacts with the page; `unlockAudio` must be
// called from a click or key press before the first sound can play.

const SOUND_ALERTS_KEY = 'servixos-sound-alerts';
const SOUND_ALERTS_EVENT = 'servixos:sound-alerts';

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

// A function, so TypeScript doesn't keep a narrowed `state` across an await.
const isRunning = (ctx: AudioContext) => ctx.state === 'running';

/** Resumes the audio context inside a user gesture. Returns true once audio can play. */
export async function unlockAudio(): Promise<boolean> {
  const ctx = getContext();
  if (!ctx) return false;
  if (isRunning(ctx)) return true;
  try {
    // Both calls must happen synchronously inside the gesture; Safari only unlocks when a
    // source starts before the first await.
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start();
    await ctx.resume();
  } catch {
    return false;
  }
  return isRunning(ctx);
}

// ─── Per-device "Sound alerts" setting ────────────────────────────────────────

export function getSoundAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_ALERTS_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundAlertsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_ALERTS_KEY, enabled ? 'on' : 'off');
  } catch {}
  window.dispatchEvent(new Event(SOUND_ALERTS_EVENT));
}

/** For useSyncExternalStore: fires on changes in this tab and in other tabs. */
export function subscribeSoundAlerts(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === SOUND_ALERTS_KEY && onChange();
  window.addEventListener(SOUND_ALERTS_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SOUND_ALERTS_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

// ─── Synth building blocks ────────────────────────────────────────────────────

const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

interface ToneOptions {
  type: OscillatorType;
  freq: number;
  start: number;
  duration: number;
  gain: number;
  detune?: number;
}

function tone(ctx: AudioContext, out: AudioNode, o: ToneOptions) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = o.type;
  osc.detune.value = o.detune ?? 0;
  osc.frequency.setValueAtTime(o.freq, o.start);
  // Fast attack, exponential decay: a plucked, bell-like envelope.
  env.gain.setValueAtTime(0.0001, o.start);
  env.gain.exponentialRampToValueAtTime(o.gain, o.start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, o.start + o.duration);
  osc.connect(env).connect(out);
  osc.start(o.start);
  osc.stop(o.start + o.duration + 0.05);
}

function masterBus(ctx: AudioContext, volume: number) {
  // The compressor keeps stacked notes from clipping.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 6;
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(compressor).connect(ctx.destination);
  return master;
}

// ─── Sounds ───────────────────────────────────────────────────────────────────

/** A felt-mallet note: the fundamental plus soft, fast-fading overtones, like a vibraphone. */
function mallet(ctx: AudioContext, out: AudioNode, note: number, start: number, duration: number, gain: number) {
  const freq = midiToHz(note);
  tone(ctx, out, { type: 'sine', freq, start, duration, gain });
  tone(ctx, out, { type: 'sine', freq: freq * 2, start, duration: duration * 0.45, gain: gain * 0.25 });
  tone(ctx, out, { type: 'sine', freq: freq * 4, start, duration: 0.12, gain: gain * 0.06 });
}

/** A short, soft echo that gives the booking sound a sense of room. */
function room(ctx: AudioContext, out: AudioNode): AudioNode {
  const input = ctx.createGain();
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.17;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 2200;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  input.connect(out);
  input.connect(delay).connect(damp).connect(feedback).connect(delay);
  damp.connect(wet).connect(out);
  return input;
}

/** Warm and unhurried: a rolled Ab major 9 chord on mallets over a low root, with a little room. */
function playBookingSound(ctx: AudioContext) {
  const master = masterBus(ctx, 0.75);
  // Takes the edge off the overtones so nothing sounds bright or toy-like.
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 3200;
  lowpass.connect(master);
  const out = room(ctx, lowpass);
  const t = ctx.currentTime + 0.02;

  // Ab4, C5, Eb5, G5: each note rings on under the next.
  [68, 72, 75, 79].forEach((note, i) => {
    mallet(ctx, out, note, t + i * 0.11, 1.6 - i * 0.15, 0.26);
  });
  tone(ctx, out, { type: 'sine', freq: midiToHz(44), start: t, duration: 1.4, gain: 0.18 });
}

/** Quiet two-note chime for any other notification type. */
function playChime(ctx: AudioContext) {
  const out = masterBus(ctx, 0.45);
  const t = ctx.currentTime + 0.02;
  tone(ctx, out, { type: 'sine', freq: midiToHz(84), start: t, duration: 0.35, gain: 0.3 });
  tone(ctx, out, { type: 'sine', freq: midiToHz(91), start: t + 0.12, duration: 0.5, gain: 0.3 });
}

/** `blocked`: the browser is holding audio until the user clicks or types on the page. */
export type SoundResult = 'played' | 'muted' | 'blocked' | 'unsupported';

// Without a recent click or key press, resume() can hang rather than reject; don't wait on it.
const RESUME_TIMEOUT_MS = 300;

/**
 * Plays the sound for a notification type. Callers show the pop-up whatever the result,
 * and can offer a "tap to hear" when it is `blocked`.
 */
export async function playNotificationSound(type: string): Promise<SoundResult> {
  if (!getSoundAlertsEnabled()) return 'muted';
  const ctx = getContext();
  if (!ctx) return 'unsupported';
  if (!isRunning(ctx)) {
    try {
      await Promise.race([ctx.resume(), new Promise((resolve) => setTimeout(resolve, RESUME_TIMEOUT_MS))]);
    } catch {
      return 'blocked';
    }
  }
  if (!isRunning(ctx)) return 'blocked';
  if (type === 'new_booking') playBookingSound(ctx);
  else playChime(ctx);
  return 'played';
}
