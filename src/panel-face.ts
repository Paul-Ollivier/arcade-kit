"use client";

import { createContext, useContext } from "react";

/**
 * The face colour of the nearest `NineSlicePanel` ancestor — `null` outside one.
 *
 * Panels come in every tone the arcade uses (amber, cash-out green, the hub's
 * navy shop, the vault's gunmetal, the quests' violet, RR's ocean…), and the
 * chrome that sits ON a panel should be cut from the same cloth. Rather than
 * make 20 call sites repeat the panel's hex, the panel publishes its own face
 * and the chrome reads it: see `CloseButton`.
 */
export const PanelFaceContext = createContext<string | null>(null);

/** The nearest panel's face colour, or `null` when there is no panel above. */
export function usePanelFace(): string | null {
  return useContext(PanelFaceContext);
}

/** Parse `#rgb` / `#rrggbb` / `rgb()` / `rgba()` into 0–255 channels. */
function parseColor(css: string): [number, number, number] | null {
  const s = css.trim();
  if (s.startsWith("#")) {
    const m = s.slice(1);
    const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
    if (n.length < 6 || /[^0-9a-f]/i.test(n.slice(0, 6))) return null;
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as [number, number, number];
  return null;
}

const hex = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");

/**
 * Perceived lightness of a colour, 0 (black) to 1 (white) — the sRGB luma
 * weights, which are close enough for deciding "is this panel dark?" without
 * dragging in a colour-space library. Null when the colour can't be read.
 */
export function colorLightness(css: string): number | null {
  const rgb = parseColor(css);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Blend `css` toward `target` by `amount` (0 = unchanged, 1 = fully target).
 * Returns null when the colour isn't a form we can read (a gradient, a CSS var,
 * `color-mix(...)`), so callers can fall back rather than emit a broken value.
 */
export function mixColor(css: string, target: "black" | "white", amount: number): string | null {
  const rgb = parseColor(css);
  if (!rgb) return null;
  const t = target === "black" ? 0 : 255;
  return `#${rgb.map((c) => hex(c + (t - c) * amount)).join("")}`;
}

/**
 * Re-cut a colour at a new lightness and/or saturation, KEEPING ITS HUE — for
 * chrome that should read as the same family as its panel but "much lighter
 * and more saturated" (or the reverse), which a plain mix toward white/black
 * can't do: mixing toward white washes the hue out. Each target is either an
 * absolute 0–1 value or a function of the current one. Null when the colour
 * can't be read (same contract as `mixColor`).
 */
export function adjustColor(
  css: string,
  to: { lightness?: number | ((l: number) => number); saturation?: number | ((s: number) => number) },
): string | null {
  const rgb = parseColor(css);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(rgb);
  const pick = (t: number | ((v: number) => number) | undefined, v: number) =>
    t === undefined ? v : Math.max(0, Math.min(1, typeof t === "function" ? t(v) : t));
  const [r, g, b] = hslToRgb(h, pick(to.saturation, s), pick(to.lightness, l));
  return `#${hex(r)}${hex(g)}${hex(b)}`;
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
  if (s === 0) return [l * 255, l * 255, l * 255];
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
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
