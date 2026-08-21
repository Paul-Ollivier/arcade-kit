"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ARROW_SIZE, ARROW_URLS, type ArrowDir } from "./arrows";

/**
 * The arcade's nav arrow, in any colour.
 *
 * The four PNGs are drawn in GREY on purpose: they are a LUMINOSITY MODEL, not
 * a finished look. Each of their four tones — outline, shadow, surface,
 * highlight — is re-cut here at the same relative brightness but in the tint's
 * own hue and saturation, so a gold arrow keeps exactly the shading the pixel
 * artist drew and no second sprite has to exist. Passing no `color` renders the
 * PNG untouched.
 *
 * Recolouring happens once per (direction, colour) on a canvas and is cached
 * module-wide, so a page full of arrows costs one paint each, and a press that
 * flips the colour back and forth costs nothing after the first flip.
 *
 * PRESS FEEDBACK: pass `active` to force the pressed colour. The usual wiring
 * is `usePressFlash` below, which holds the colour for a minimum beat on a
 * quick tap and keeps it for as long as a long press lasts.
 */

export interface PixelArrowProps {
  dir: ArrowDir;
  /** Rendered width in CSS px. Height follows the sprite's own ratio. */
  size?: number;
  /** Tint for the resting state. Omit for the grey sprite as drawn. */
  color?: string;
  /** Tint while `active` — the press flash. Falls back to `color`. */
  activeColor?: string;
  /** Pressed right now (see `usePressFlash`). */
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function PixelArrow({ dir, size, color, activeColor, active = false, className, style, alt = "" }: PixelArrowProps) {
  const tint = active ? (activeColor ?? color) : color;
  const src = usePixelTint(ARROW_URLS[dir], tint);
  const nat = ARROW_SIZE[dir];
  const w = size ?? nat.w;
  const h = size ? (size * nat.h) / nat.w : nat.h;
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- pixel sprite, drawn 1:1 */
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{ width: w, height: h, imageRendering: "pixelated", display: "block", ...style }}
    />
  );
}

/**
 * Press state for a tap that must still be SEEN.
 *
 * A carousel arrow's click is over in a few ms — flip a colour on pointerdown
 * and off on pointerup and a real tap produces a flash too short to register.
 * This holds the flash for `minMs` after the press begins, and beyond that for
 * as long as the finger stays down, so a long press simply stays lit.
 *
 * Spread the returned handlers on whatever element takes the press — usually
 * the hit-zone button, not the arrow itself.
 */
export function usePressFlash(minMs = 160): {
  active: boolean;
  handlers: {
    onPointerDown: (e: ReactPointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
  };
} {
  const [active, setActive] = useState(false);
  const downAt = useRef(0);
  const timer = useRef(0);
  const held = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const release = () => {
    if (!held.current) return;
    held.current = false;
    const elapsed = Date.now() - downAt.current;
    const rest = minMs - elapsed;
    if (rest <= 0) setActive(false);
    else timer.current = window.setTimeout(() => setActive(false), rest);
  };

  return {
    active,
    handlers: {
      onPointerDown: () => {
        window.clearTimeout(timer.current);
        held.current = true;
        downAt.current = Date.now();
        setActive(true);
      },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
    },
  };
}

// ── Tinting ────────────────────────────────────────────────────────────────

const cache = new Map<string, string>();

/** Resolve `url` recoloured to `color`. Returns the untinted url until the
 *  recolour is ready (and on the server), so nothing ever renders blank. */
export function usePixelTint(url: string, color?: string): string {
  const [out, setOut] = useState(url);
  useEffect(() => {
    if (!color) {
      setOut(url);
      return;
    }
    const key = `${url}|${color}`;
    const hit = cache.get(key);
    if (hit) {
      setOut(hit);
      return;
    }
    let alive = true;
    void tintPixelSprite(url, color).then((tinted) => {
      if (!tinted) return;
      cache.set(key, tinted);
      if (alive) setOut(tinted);
    });
    return () => {
      alive = false;
    };
  }, [url, color]);
  return out;
}

/**
 * Recolour a greyscale pixel sprite by mapping each pixel's BRIGHTNESS onto the
 * tint: same relative shading, new hue. The tint names the SURFACE (the sprite's
 * dominant mid-tone); darker tones go down from there and highlights up, in
 * proportion, so the art's contrast survives whatever colour it is given.
 *
 * Resolves null when there's no canvas (SSR) or the colour can't be parsed.
 */
export async function tintPixelSprite(url: string, color: string): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const rgb = parseHex(color);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(rgb);

  const img = await loadImage(url);
  if (!img) return null;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = data.data;

  // The sprite's own mid-tone is its most common opaque brightness — the
  // surface. Anchoring on it (rather than on 0.5) is what makes the tint land
  // as the surface colour instead of drifting light or dark with the art.
  const counts = new Map<number, number>();
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const lum = Math.round(lumOf(p[i], p[i + 1], p[i + 2]) * 255);
    counts.set(lum, (counts.get(lum) ?? 0) + 1);
  }
  let surface = 0.8;
  let best = -1;
  for (const [lum, n] of counts) if (n > best) { best = n; surface = lum / 255; }

  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const src = lumOf(p[i], p[i + 1], p[i + 2]);
    // Below the surface we scale toward black, above it toward white — one
    // continuous ramp through the tint, so ordering never inverts.
    const t = src <= surface
      ? (surface > 0 ? (src / surface) * l : l)
      : l + ((src - surface) / Math.max(1e-6, 1 - surface)) * (1 - l);
    const [r, g, b] = hslToRgb(h, s, Math.max(0, Math.min(1, t)));
    p[i] = r; p[i + 1] = g; p[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

const lumOf = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = url;
  });
}

function parseHex(css: string): [number, number, number] | null {
  const s = css.trim();
  if (!s.startsWith("#")) return null;
  const n = s.slice(1);
  const hex = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  if (hex.length < 6 || /[^0-9a-f]/i.test(hex.slice(0, 6))) return null;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}
