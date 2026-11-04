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
  /** Semitone pitch bend over the note, for a rising "zing". */
  bend?: number;
  detune?: number;
}

function tone(ctx: AudioContext, out: AudioNode, o: ToneOptions) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = o.type;
  osc.detune.value = o.detune ?? 0;
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.bend) osc.frequency.exponentialRampToValueAtTime(o.freq * 2 ** (o.bend / 12), o.start + o.duration);
  // Fast attack, exponential decay: a plucked, bell-like envelope.
  env.gain.setValueAtTime(0.0001, o.start);
  env.gain.exponentialRampToValueAtTime(o.gain, o.start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, o.start + o.duration);
  osc.connect(env).connect(out);
  osc.start(o.start);
  osc.stop(o.start + o.duration + 0.05);
}

/** Filtered white noise swept upwards: the "whoosh" that opens the booking sound. */
function whoosh(ctx: AudioContext, out: AudioNode, start: number, duration: number, gain: number) {
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(300, start);
  filter.frequency.exponentialRampToValueAtTime(6000, start + duration);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + duration * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(env).connect(out);
  source.start(start);
}

function masterBus(ctx: AudioContext, volume: number) {
  // The compressor keeps the stacked layers loud without clipping.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 6;
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(compressor).connect(ctx.destination);
  return master;
}

// ─── Sounds ───────────────────────────────────────────────────────────────────

/** Loud and celebratory: whoosh, a racing major arpeggio, a shimmering chord and sparkles. */
function playBookingSound(ctx: AudioContext) {
  const out = masterBus(ctx, 0.9);
  const t = ctx.currentTime + 0.02;

  whoosh(ctx, out, t, 0.35, 0.5);

  // C major arpeggio up two octaves, doubled with a detuned saw for width.
  const arpeggio = [72, 76, 79, 84, 88, 91];
  arpeggio.forEach((note, i) => {
    const start = t + 0.22 + i * 0.065;
    tone(ctx, out, { type: 'square', freq: midiToHz(note), start, duration: 0.18, gain: 0.22 });
    tone(ctx, out, { type: 'sawtooth', freq: midiToHz(note), start, duration: 0.16, gain: 0.1, detune: 12 });
  });

  // Final chord with an upward bend, held long enough to ring out.
  const chordStart = t + 0.22 + arpeggio.length * 0.065;
  [84, 88, 91, 96].forEach((note, i) => {
    tone(ctx, out, { type: 'triangle', freq: midiToHz(note), start: chordStart, duration: 1.1, gain: 0.32, bend: 0.3 });
    tone(ctx, out, { type: 'sine', freq: midiToHz(note + 12), start: chordStart + i * 0.01, duration: 0.8, gain: 0.12 });
  });
  // Sub thump under the chord.
  tone(ctx, out, { type: 'sine', freq: midiToHz(48), start: chordStart, duration: 0.45, gain: 0.5, bend: -12 });

  // Sparkles: quick random high pings over the tail.
  for (let i = 0; i < 10; i++) {
    tone(ctx, out, {
      type: 'sine',
      freq: 2200 + Math.random() * 2600,
      start: chordStart + 0.08 + i * 0.06,
      duration: 0.12,
      gain: 0.08,
    });
  }
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
