"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BitmapText, TitleText } from "./bitmap-font";
import { TYPE_SCALE } from "./typography";
import { playOneShot, startRumble, type Rumble } from "./rumble";
import "./chest-reveal.css";

/**
 * THE chest-opening ceremony, shared by the hub's shop and Rabbit Royale's
 * season pass (and any game that hands out chests later): a full-screen
 * take-over in the style of TFT's loot reveal —
 *
 *   1. RUMBLE  — the chest, big in the centre, shakes harder and harder over a
 *                dim sunburst. Escalates for as long as the roll takes (the
 *                server call is usually in flight under it) with a floor of
 *                RUMBLE_MIN_MS so a fast answer still builds tension.
 *   2. BLOW    — the roll is known: the rays snap to the rarity's palette and
 *                flare, the chest swells, whites out and is gone.
 *   3. FLASH   — a white disc bursts from the chest to fill the screen, holds.
 *   4. REVEAL  — the light is SUCKED back into the middle (exponential ease-in:
 *                slow, slow, gone) and the item fades up underneath it.
 *   5. SHOWN   — the rarity stamp slams on, the actions rise in; a tap
 *                anywhere (or Escape) is `onDone`.
 *
 * The kit owns the stage (backdrop, rays, flash, timing, stamp, caption); the
 * consumer brings the ART — the chest sprite (a render prop, so it can pop its
 * own lid at "blow") and the prize (an NFT portrait, a bunch of carrots and a
 * big line of text, …) — plus any buttons. It portals to <body> and sits above
 * every modal (z 1000 by default), so an in-iframe game should already be
 * holding `domin8:modal` open when it shows this.
 *
 * Rarity palettes are the arcade's loot tints: bronze/common, silver/rare,
 * gold/epic, violet/legendary — vibrant, like the sunburst behind the cabinet.
 *
 * SOUND is opt-in and consumer-supplied (`sfx`): the kit can't ship these —
 * they live in each app's `public/` and bust the kit's ~32 KB embed budget —
 * and the two apps carry different mute state. The one exception is the rumble,
 * which is SYNTHESISED here (see `rumble.ts`) because it has to track the
 * shake's own escalation for an unpredictable length of time. Everything is
 * gated on `sfxMuted`, and nothing is constructed until it plays, so a muted
 * player downloads none of it.
 */

export type RevealRarity = "common" | "rare" | "epic" | "legendary";
export type RevealPhase = "rumble" | "blow" | "flash" | "reveal" | "shown";

/** URLs for the ceremony's one-shots. Every entry is optional — a beat with no
 *  URL is simply silent. `reveal` may be a single URL or one per rarity, so a
 *  legendary can land on a fanfare while a common gets a ding. */
export interface ChestRevealSfx {
  /** Played as the chest bursts (a short explosion). */
  blow?: string;
  /** An upward riser under the whiteout. Started with the blow, so pick one
   *  whose peak lands ~200 ms in. */
  flash?: string;
  /** The prize's arrival, as the light drains. */
  reveal?: string | Partial<Record<RevealRarity, string>>;
  /** The rarity stamp's slam. */
  stamp?: string;
  /** Set false to leave the rumble silent (the synth is on by default when
   *  sound is enabled at all). */
  rumble?: boolean;
}

export interface ChestRevealProps {
  /** What the chest rolled. `null` while unknown (request in flight): the
   *  rumble keeps escalating and the rays stay neutral until it's set. */
  rarity: RevealRarity | null;
  /** The chest art to shake and blow up. Called with the current phase so the
   *  consumer can pop its own lid on "blow"; from "flash" on it is unmounted. */
  chest: (phase: RevealPhase) => ReactNode;
  /** The prize, shown from "reveal": an image, a sprite, a line of TitleText… */
  item: ReactNode;
  /** Slammed over the item once shown (e.g. "LEGENDARY!"). ASCII only. */
  stamp?: string;
  /** One-shot URLs per beat (see `ChestRevealSfx`). Omit for a silent stage. */
  sfx?: ChestRevealSfx;
  /** The player's SFX bus is muted — plays nothing and builds nothing. Wire
   *  this to the hub's `domin8:mute` `sfxMuted`, not to the music flag: every
   *  sound here is a one-shot or a short bed, not a loop. */
  sfxMuted?: boolean;
  /** Master volume for the one-shots, 0..1. */
  volume?: number;
  /** Buttons under the item (shown phase). Clicks inside never dismiss. */
  actions?: ReactNode;
  /** The player tapped through (or pressed Escape) after the reveal. */
  onDone: () => void;
  /** Caption under everything once shown. Default "TAP TO CONTINUE". */
  caption?: string;
  zIndex?: number;
}

/** The rarity's accent — the stamp, and what consumers tint their prize with. */
export const REVEAL_ACCENT: Record<RevealRarity, string> = {
  common: "#d9a05a",
  rare: "#c9d3dd",
  epic: "#f5c518",
  legendary: "#c98cff",
};

/** Three-stop ray palettes per rarity (cycled around the burst), plus the
 *  neutral one the rumble runs under before the roll is known. */
const RAY_PALETTES: Record<RevealRarity | "neutral", [string, string, string]> = {
  neutral:   ["#3b3224", "#4e4230", "#2f2819"],
  common:    ["#b4763a", "#e0a35c", "#8a5526"],
  rare:      ["#5e9fd8", "#c9d3dd", "#3a6fb5"],
  epic:      ["#f5c518", "#ff8a1f", "#ffe866"],
  legendary: ["#b96bff", "#ff5bd6", "#6f2bd9"],
};

const RUMBLE_MIN_MS = 1700; // the shake builds at least this long, even on an instant roll
const BLOW_MS = 230;
const FLASH_HOLD_MS = 110; // full-white hold between the burst and the drain
const SUCK_MS = 620;
const STAMP_DELAY_MS = 380; // after "shown" begins
const RUMBLE_MAX_PX = 11;   // peak jitter amplitude, in px (and ~deg/1.4 of tilt)

export function ChestReveal({ rarity, chest, item, stamp, actions, onDone, caption = "TAP TO CONTINUE", zIndex = 1000, sfx, sfxMuted = false, volume = 1 }: ChestRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>("rumble");
  const [minRumbleDone, setMinRumbleDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();
  const chestRef = useRef<HTMLDivElement>(null);
  const rumbleStart = useRef(0);
  const rumbleRef = useRef<Rumble | null>(null);
  // Audio is read from a ref inside the RAF loop and the phase effects, so a
  // prop change mid-ceremony (the player hits mute) takes effect on the next
  // frame without re-running either effect.
  const audioRef = useRef({ sfx, sfxMuted, volume });
  audioRef.current = { sfx, sfxMuted, volume };

  useEffect(() => setMounted(true), []);

  // Rumble floor.
  useEffect(() => {
    const t = window.setTimeout(() => setMinRumbleDone(true), reduced ? 300 : RUMBLE_MIN_MS);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // The JS rumble: amplitude grows with elapsed time (quadratically, capped),
  // the jitter itself is a deterministic sum of sines so it looks restless,
  // not random-flickery. Stops the instant the phase leaves "rumble".
  //
  // `mounted` is a REAL dependency, not noise: the component renders null until
  // it flips (the portal needs a document), so on the first pass `chestRef` is
  // empty and this effect bails. Without it in the deps nothing re-runs it when
  // the DOM finally exists, and both the shake AND the synth stay dead for the
  // whole ceremony — silently, because every other beat is CSS.
  useEffect(() => {
    if (!mounted || phase !== "rumble" || reduced) return;
    const el = chestRef.current;
    if (!el) return;
    rumbleStart.current = performance.now();
    const sound = audioRef.current;
    if (!sound.sfxMuted && sound.sfx?.rumble !== false && sound.sfx) rumbleRef.current = startRumble();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - rumbleStart.current) / 1000;
      const ramp = Math.min(1, t / (RUMBLE_MIN_MS / 1000));
      const amp = RUMBLE_MAX_PX * ramp * ramp;
      const x = amp * (Math.sin(t * 61) * 0.6 + Math.sin(t * 97 + 1.3) * 0.4);
      const y = amp * 0.5 * (Math.sin(t * 83 + 0.7) * 0.6 + Math.sin(t * 131) * 0.4);
      const r = (amp / 1.4) * (Math.sin(t * 71 + 2.1) * 0.7 + Math.sin(t * 113) * 0.3);
      const s = 1 + 0.14 * ramp;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      // The synth rides the SAME ramp as the jitter, so what you hear and what
      // you see escalate as one thing. Muting mid-rumble kills it immediately.
      if (rumbleRef.current) {
        if (audioRef.current.sfxMuted) {
          rumbleRef.current.stop();
          rumbleRef.current = null;
        } else {
          rumbleRef.current.setIntensity(ramp * ramp);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      rumbleRef.current?.stop();
      rumbleRef.current = null;
    };
  }, [mounted, phase, reduced]);

  // Phase machine: rumble → (roll known ∧ floor reached) → blow → flash →
  // reveal → shown. The gate and the chain are SEPARATE effects on purpose: a
  // single effect keyed on `phase` would cancel its own follow-up timers in
  // the cleanup that runs the instant it flips the phase (it did — the stage
  // froze white on "blow").
  useEffect(() => {
    if (phase !== "rumble" || rarity === null || !minRumbleDone) return;
    setPhase(reduced ? "shown" : "blow");
  }, [phase, rarity, minRumbleDone, reduced]);
  useEffect(() => {
    const next = NEXT_PHASE[phase];
    if (!next) return;
    const t = window.setTimeout(() => setPhase(next[0]), next[1]);
    return () => window.clearTimeout(t);
  }, [phase]);

  // One-shots, fired on the phase they belong to. The riser goes off WITH the
  // blow rather than before it: the stage only learns the roll landed at that
  // moment, so there is nothing to anticipate with — pick a riser whose peak
  // sits ~200 ms in and it lands on the whiteout.
  useEffect(() => {
    const { sfx: s, sfxMuted: muted, volume: vol } = audioRef.current;
    if (!s || muted) return;
    if (phase === "blow") {
      playOneShot(s.blow, vol);
      playOneShot(s.flash, vol * 0.8);
    } else if (phase === "reveal") {
      const r = typeof s.reveal === "string" ? s.reveal : rarity ? s.reveal?.[rarity] : undefined;
      playOneShot(r, vol);
    } else if (phase === "shown") {
      playOneShot(s.stamp, vol * 0.7);
    }
    // `rarity` is settled by the time any of these fire; re-running on it would
    // double-play a beat if the consumer re-rendered with the same phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Escape = tap through, once there is something to tap through to.
  const shown = phase === "shown";
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onDone();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [shown, onDone]);

  if (!mounted || typeof document === "undefined") return null;

  // Rays wear the rarity only from the blow on — the colour IS the reveal.
  const rayPalette = phase === "rumble" || rarity === null ? "neutral" : rarity;
  const accent = rarity ? REVEAL_ACCENT[rarity] : REVEAL_ACCENT.epic;
  const past = (p: RevealPhase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={stamp ? `Chest opened - ${stamp}` : "Chest opening"}
      className="d8-reveal-backdrop-in"
      // Always swallow the click: a consumer that renders this inside its own
      // tap-to-close overlay must not have the modal close under the stage.
      onClick={(e) => {
        e.stopPropagation();
        if (shown) onDone();
      }}
      style={{ ...overlayStyle, zIndex, cursor: shown ? "pointer" : "default" }}
    >
      {/* Sunburst — its own layer so the pulse filter never touches the art. */}
      <div className={past("blow") ? "d8-reveal-rays-pulse" : undefined} style={raysWrapStyle} aria-hidden>
        <RayBurst palette={RAY_PALETTES[rayPalette]} />
      </div>

      {/* The chest, centred, rumbling — until it blows. */}
      {!past("flash") && (
        <div style={centreStyle} aria-hidden>
          <div ref={chestRef} className={phase === "blow" ? "d8-reveal-blow" : undefined} style={{ display: "inline-flex", willChange: "transform" }}>
            {chest(phase)}
          </div>
        </div>
      )}

      {/* The prize + stamp + actions, from the reveal on. */}
      {past("reveal") && (
        <div style={centreColumnStyle}>
          <div style={{ position: "relative", display: "inline-flex" }}>
            {phase === "reveal" && <div className="d8-reveal-glow" style={{ ...glowStyle, background: `radial-gradient(circle, ${accent}aa 0 18%, ${accent}33 38%, transparent 62%)` }} aria-hidden />}
            <div className="d8-reveal-item" style={{ position: "relative", display: "inline-flex" }}>
              {item}
            </div>
            {stamp && shown && (
              <div className="d8-reveal-stamp" style={{ ...stampStyle, animationDelay: `${STAMP_DELAY_MS}ms` }} aria-hidden>
                <TitleText scale={TYPE_SCALE.title} style={{ color: accent, textShadow: "0 4px 0 rgba(0,0,0,0.6)" }}>
                  {stamp}
                </TitleText>
              </div>
            )}
          </div>
          {actions && shown && (
            <div className="d8-reveal-rise" style={{ ...actionsStyle, animationDelay: `${STAMP_DELAY_MS + 260}ms` }} onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* The flash: ONE element across all three of its beats — it bursts out
          with the chest (blow), holds full-screen (flash), then drains into the
          centre (reveal). Rendering it once, in a fixed slot, is what keeps it
          from restarting its expansion on each phase change; two elements in
          series held the screen white for twice as long. */}
      {(phase === "blow" || phase === "flash" || phase === "reveal") && (
        <div
          className={phase === "blow" ? "d8-reveal-flash-in" : phase === "reveal" ? "d8-reveal-flash-suck" : undefined}
          style={{ ...flashStyle, ...(phase === "flash" ? { transform: "scale(1)" } : null) }}
          aria-hidden
        />
      )}

      {shown && (
        <div className="d8-reveal-rise" style={{ ...captionStyle, animationDelay: `${STAMP_DELAY_MS + 500}ms` }} aria-hidden>
          <span className="d8-reveal-blink" style={{ display: "inline-flex" }}>
            <BitmapText scale={TYPE_SCALE.caption} style={{ color: "#fef3c7" }}>
              {caption}
            </BitmapText>
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}

const PHASE_ORDER: RevealPhase[] = ["rumble", "blow", "flash", "reveal", "shown"];
/** Each timed phase's successor and how long it holds. */
const NEXT_PHASE: Partial<Record<RevealPhase, [RevealPhase, number]>> = {
  blow: ["flash", BLOW_MS],
  flash: ["reveal", FLASH_HOLD_MS],
  reveal: ["shown", SUCK_MS],
};

function useReducedMotion(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setR(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return r;
}

// ── Sunburst ────────────────────────────────────────────────────────────────
// The cabinet's backdrop, distilled: N pixel rays on a small canvas, CSS-scaled
// with `pixelated` so the ray edges stair-step, radially faded to nothing at
// the edge, spun slowly by CSS. The palette lerps toward its target every
// frame so a rarity change is a wash of colour, not a cut.

const RAYS = 36;
const RAY_CANVAS = 384;
const LERP = 0.12;

function RayBurst({ palette }: { palette: [string, string, string] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(palette.map(parseHex));
  const shownRef = useRef<[number, number, number][] | null>(null);
  targetRef.current = palette.map(parseHex);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = RAY_CANVAS;
    canvas.height = RAY_CANVAS;
    if (!shownRef.current) shownRef.current = targetRef.current.map((c) => [...c] as [number, number, number]);
    const cx = RAY_CANVAS / 2, cy = RAY_CANVAS / 2, rad = RAY_CANVAS;
    const rayW = (Math.PI * 2) / RAYS;
    let raf = 0;
    const draw = () => {
      const shown = shownRef.current!;
      const target = targetRef.current;
      let moving = false;
      for (let i = 0; i < shown.length; i++) {
        for (let k = 0; k < 3; k++) {
          const d = target[i][k] - shown[i][k];
          if (Math.abs(d) > 0.5) moving = true;
          shown[i][k] += d * LERP;
        }
      }
      ctx.clearRect(0, 0, RAY_CANVAS, RAY_CANVAS);
      for (let i = 0; i < RAYS; i++) {
        const c = shown[i % shown.length];
        ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rad, i * rayW, i * rayW + rayW * 1.12);
        ctx.closePath();
        ctx.fill();
      }
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      const mask = ctx.createRadialGradient(cx, cy, 0, cx, cy, RAY_CANVAS * 0.5);
      mask.addColorStop(0, "rgba(255,255,255,1)");
      mask.addColorStop(0.35, "rgba(255,255,255,0.85)");
      mask.addColorStop(0.7, "rgba(255,255,255,0.3)");
      mask.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, RAY_CANVAS, RAY_CANVAS);
      ctx.restore();
      // Keep repainting only while a palette change is still washing through;
      // a settled burst is a static bitmap the CSS spin carries.
      if (moving) raf = requestAnimationFrame(draw);
    };
    draw();
    // Re-arm the loop whenever the palette prop changes (effect deps below).
    return () => cancelAnimationFrame(raf);
  }, [palette]);

  return <canvas ref={ref} className="d8-reveal-rays" style={raysStyle} />;
}

function parseHex(h: string): [number, number, number] {
  const n = h.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

// ── styles ──────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(6, 5, 14, 0.94)",
  overflow: "hidden",
  display: "block",
  userSelect: "none",
  WebkitUserSelect: "none",
};

const raysWrapStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const raysStyle: CSSProperties = {
  width: "200vmax",
  height: "200vmax",
  flexShrink: 0,
  imageRendering: "pixelated",
  opacity: 0.85,
};

const centreStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const centreColumnStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 22,
  padding: 24,
  boxSizing: "border-box",
};

const glowStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "120vmin",
  height: "120vmin",
  marginLeft: "-60vmin",
  marginTop: "-60vmin",
  pointerEvents: "none",
};

// The keyframe owns `transform`, so the stamp centres by spanning the item's
// width and centring its text, not by a translate the animation would clobber.
const stampStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: -18,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  display: "flex",
  justifyContent: "center",
  transformOrigin: "50% 50%",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "center",
};

const flashStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "250vmax",
  height: "250vmax",
  marginLeft: "-125vmax",
  marginTop: "-125vmax",
  borderRadius: "50%",
  background: "radial-gradient(circle, #ffffff 0 40%, #fff8e0 70%, #fff1c2 100%)",
  pointerEvents: "none",
  transformOrigin: "50% 50%",
};

const captionStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
};
