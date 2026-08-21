/**
 * The chest-rumble synth — a WebAudio noise bed whose loudness and colour rise
 * with the shake, used by `ChestReveal`.
 *
 * Why synthesised rather than a file: the rumble has to escalate for an UNKNOWN
 * duration (it covers a server round-trip) and stop dead on the blow. A looped
 * asset can't track the shake's own ramp, would need a gain envelope anyway,
 * and the smallest candidate in the arcade's library is 422 KB. This is a few
 * hundred bytes of code, is sample-accurate against the same `ramp` value that
 * drives the sprite's jitter, and costs nothing when the player has SFX muted
 * (nothing is constructed until the first `start()`).
 *
 * Signal: looping brown-ish noise → lowpass → gain → destination, plus a low
 * sine an octave under it for the body you feel more than hear. `setIntensity`
 * opens the filter and the gain together, so early rumble is a distant
 * low-frequency grumble and the peak is a full, bright shudder.
 *
 * The AudioContext is created on first `start()` — always inside the click that
 * opened the chest, so autoplay policy is satisfied.
 */

const NOISE_SECONDS = 2;
/** Filter cutoff at rest → at full shake (Hz). */
const CUTOFF_MIN = 110;
const CUTOFF_MAX = 900;
/** Noise gain at rest → at full shake. Deliberately modest: this sits UNDER
 *  the one-shots, and a chest that roars louder than its own explosion reads
 *  as a bug. */
const GAIN_MIN = 0.02;
const GAIN_MAX = 0.3;
/** The sub-sine's pitch (Hz) and its share of the mix. */
const SUB_HZ_MIN = 32;
const SUB_HZ_MAX = 58;
const SUB_GAIN = 0.35;
/** How fast the audible level chases `setIntensity` (seconds). Short enough to
 *  feel keyed to the shake, long enough that per-frame calls don't zipper. */
const SMOOTH = 0.06;
/** Fade-out on stop. Cutting a noise bed dead clicks; this is short enough to
 *  still read as "the shaking stopped". */
const RELEASE = 0.05;

export interface Rumble {
  /** 0..1 — how hard the chest is shaking right now. Safe to call per frame. */
  setIntensity(v: number): void;
  /** Fade out and release the audio graph. Idempotent. */
  stop(): void;
}

/** Start a rumble. Returns null when WebAudio isn't available (SSR, ancient
 *  browsers) so callers can treat sound as optional without guarding. */
export function startRumble(): Rumble | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }

  // Brown-ish noise: white noise integrated, then normalised. One buffer,
  // looped — cheaper and steadier than generating per frame.
  const buffer = ctx.createBuffer(1, ctx.sampleRate * NOISE_SECONDS, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = CUTOFF_MIN;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = SUB_HZ_MIN;
  const subGain = ctx.createGain();
  subGain.gain.value = 0;

  noise.connect(filter).connect(gain).connect(ctx.destination);
  sub.connect(subGain).connect(ctx.destination);
  noise.start();
  sub.start();

  let stopped = false;
  return {
    setIntensity(v: number) {
      if (stopped) return;
      const t = Math.max(0, Math.min(1, v));
      const now = ctx.currentTime;
      // `setTargetAtTime` glides instead of stepping, so a per-frame call
      // stream reads as one continuous swell rather than 60 tiny jumps.
      filter.frequency.setTargetAtTime(CUTOFF_MIN + (CUTOFF_MAX - CUTOFF_MIN) * t, now, SMOOTH);
      gain.gain.setTargetAtTime(GAIN_MIN + (GAIN_MAX - GAIN_MIN) * t, now, SMOOTH);
      sub.frequency.setTargetAtTime(SUB_HZ_MIN + (SUB_HZ_MAX - SUB_HZ_MIN) * t, now, SMOOTH);
      subGain.gain.setTargetAtTime(GAIN_MAX * SUB_GAIN * t, now, SMOOTH);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      subGain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, RELEASE);
      subGain.gain.setTargetAtTime(0, now, RELEASE);
      window.setTimeout(() => {
        try {
          noise.stop();
          sub.stop();
          void ctx.close();
        } catch {
          /* already torn down */
        }
      }, RELEASE * 1000 * 6);
    },
  };
}

/** Fire-and-forget one-shot. The Audio element is built HERE, at play time —
 *  a player who keeps SFX muted never downloads the bytes (the kit's standing
 *  rule for audio). A blocked/failed play is not an error worth surfacing. */
export function playOneShot(url: string | undefined, volume = 1): void {
  if (!url || typeof window === "undefined") return;
  try {
    const a = new Audio(url);
    a.volume = Math.max(0, Math.min(1, volume));
    void a.play().catch(() => {});
  } catch {
    /* no audio in this environment */
  }
}
