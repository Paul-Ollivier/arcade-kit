// Canvas-2D renderer for the kit's basic (body) pixel font.
//
// Some surfaces draw text straight onto a <canvas> (e.g. the hub's CRT attract /
// leaderboard screens) rather than the DOM or Pixi. This blits glyphs from the
// basic font atlas so those surfaces use the SAME font as everything else,
// instead of a web font like "Press Start 2P".
//
//   await loadBitmapFontImage();                 // once, before first draw
//   drawBitmapText(ctx, "INSERT COIN", x, y, { role: "body", color: "#f5c518", align: "center" });
//
// Body face only (the unified "normal text" font). For big titles, draw the body
// font at a larger scale, or use the Pixi/DOM title face on a non-canvas layer.

import { assetUrl } from "./asset-url";
import { TYPE_SCALE, type TypeRole } from "./typography";
import basicPng from "./assets/basicpixel_8x8.png";

// basicpixel_8x8.png — 10×10 grid of 8×8 cells, printable ASCII 0x20–0x7e
// row-major from space. The atlas is white, so a per-colour tint is a flat fill.
const BASIC_URL = assetUrl(basicPng);
const COLS = 10;
const CELL = 8;
// Pen advance per glyph (1px tighter than the 8-px cell — the atlas' rightmost
// column is padding). Glyphs are still drawn CELL (8) wide.
const ADVANCE = 7;
const FIRST = 0x20;
const LAST = 0x7e;

let fontImage: HTMLImageElement | null = null;
let loadPromise: Promise<HTMLImageElement> | null = null;

/** Preload the font atlas image. Idempotent; resolves to the cached image.
 *  Call (and await) once before `drawBitmapText`. */
export function loadBitmapFontImage(): Promise<HTMLImageElement> {
  if (fontImage) return Promise.resolve(fontImage);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      fontImage = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = BASIC_URL;
  });
  return loadPromise;
}

// One tinted copy of the (white) atlas per colour, cached. `source-in` keeps the
// glyph alpha and floods the colour through it.
const tintCache = new Map<string, HTMLCanvasElement>();
function tintedAtlas(color: string): HTMLCanvasElement {
  const hit = tintCache.get(color);
  if (hit) return hit;
  const img = fontImage!;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const cx = c.getContext("2d")!;
  cx.imageSmoothingEnabled = false;
  cx.drawImage(img, 0, 0);
  cx.globalCompositeOperation = "source-in";
  cx.fillStyle = color;
  cx.fillRect(0, 0, c.width, c.height);
  tintCache.set(color, c);
  return c;
}

export interface DrawBitmapTextOptions {
  /** Per-source-pixel scale. Overrides `role` when set. */
  scale?: number;
  /** Type-scale role (default "body"). */
  role?: TypeRole;
  /** CSS colour string (default white). */
  color?: string;
  /** Horizontal anchor relative to `x` (default "left"). */
  align?: "left" | "center" | "right";
  /** Extra source-px between glyphs (pre-scale). */
  letterSpacing?: number;
}

/** Measure the rendered width (px) of `text` at the given scale/role. */
export function measureBitmapText(text: string, opts: DrawBitmapTextOptions = {}): number {
  const scale = opts.scale ?? TYPE_SCALE[opts.role ?? "body"];
  const ls = opts.letterSpacing ?? 0;
  const n = [...text].length;
  return n > 0 ? (n * (ADVANCE + ls) - ls) * scale : 0;
}

/**
 * Draw `text` in the kit basic pixel font onto a 2D context. `y` is the glyph
 * top; `x` is the left edge (or centre/right per `align`). Returns the rendered
 * width in px. `loadBitmapFontImage()` must have resolved first (else no-op → 0).
 */
export function drawBitmapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: DrawBitmapTextOptions = {}
): number {
  if (!fontImage) return 0;
  const scale = opts.scale ?? TYPE_SCALE[opts.role ?? "body"];
  const ls = opts.letterSpacing ?? 0;
  const atlas = tintedAtlas(opts.color ?? "#ffffff");
  const chars = [...text];
  const width = measureBitmapText(text, opts);
  let startX = x;
  if (opts.align === "center") startX = x - width / 2;
  else if (opts.align === "right") startX = x - width;

  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const adv = (ADVANCE + ls) * scale;
  chars.forEach((ch, i) => {
    const code = ch.codePointAt(0) ?? 0;
    if (code < FIRST || code > LAST) return; // space / unknown → blank cell
    const idx = code - FIRST;
    const sx = (idx % COLS) * CELL;
    const sy = Math.floor(idx / COLS) * CELL;
    ctx.drawImage(atlas, sx, sy, CELL, CELL, startX + i * adv, y, CELL * scale, CELL * scale);
  });
  ctx.imageSmoothingEnabled = prevSmoothing;
  return width;
}
