// Bitmap-font renderers wired to atlases bundled with the kit.
//
//   <BitmapText scale={2}>PLAY NOW</BitmapText>      // general pixel label
//   <TitleText scale={7}>DOMIN8</TitleText>          // chunky outlined display
//
// BitmapText uses `basicpixel_8x8.png` — a pure-black glyph sheet, drawn as a
// CSS mask so its colour comes from `color` (inherits like normal text). Full
// printable ASCII, so it handles any short label.
//
// TitleText uses `font-8x7-outline.png` — a full-colour outlined display face
// (caps + digits + a few symbols, with a 3-D extrude). Drawn as a background
// image so it keeps its own palette; input is upper-cased automatically.
//
// Both render one <span> per glyph, sampled from the atlas grid. Characters not
// in a face's charset render as a blank of one glyph's width.

import type { CSSProperties } from "react";
import { assetUrl } from "./asset-url";
import asciiPng from "./assets/basicpixel_8x8.png";
import outlinePng from "./assets/font-8x7-outline.png";

// ── basicpixel_8x8.png — 80×80, a 10×10 grid of 8×8 cells, printable ASCII
//    32–126 row-major from space.
const ASCII_SRC = assetUrl(asciiPng);
const ASCII_CHARSET =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
const ASCII_COLS = 10;
const ASCII_GW = 8;
const ASCII_GH = 8;

// ── font-8x7-outline.png — 128×48, a 16×4 grid of 8×12 cells. Caps + digits
//    fill rows 0–1; rows 2–3 carry a handful of symbols (and trailing blanks
//    that double as the space glyph). Glyph art is top-aligned in each cell.
const OUTLINE_SRC = assetUrl(outlinePng);
const OUTLINE_CHARSET =
  "ABCDEFGHIJKLMNOP" +
  "QRSTUVWXYZ123456" +
  "7890@,.!?:*%)(+-" +
  "/\\=><'\"$        ";
const OUTLINE_COLS = 16;
const OUTLINE_GW = 8;
const OUTLINE_GH = 12;

type FaceProps = {
  children: string | number;
  /** Integer upscale (px). Ignored when `unit` is set. */
  scale: number;
  /** Rendered size of ONE source pixel as any CSS length (e.g. "0.4vh"). When
   *  set, the glyph scales in that unit instead of `scale` px — lets the font
   *  ride the same responsive unit as its container (the vh-based cabinet). */
  unit?: string;
  /** Extra space between rendered glyphs — px number, or a CSS length. */
  tracking?: number | string;
  /** Width of the blank space glyph as a fraction of one cell (default 1 = a
   *  full cell). Lower it to tighten the gap between words. */
  spaceScale?: number;
  className?: string;
  style?: CSSProperties;
};

type Atlas = {
  src: string;
  charset: string;
  cols: number;
  gw: number;
  gh: number;
  /** Per-glyph horizontal step in source px (the layout advance). Defaults to
   *  `gw`; set smaller than `gw` to tighten letter-spacing (the glyph bitmap
   *  still draws `gw` wide, clipped to this step). */
  advance?: number;
  /** Black-glyph sheet → draw via CSS mask + currentColor; full-colour → background image. */
  mask: boolean;
};

function BitmapFace({ atlas, children, scale, unit, tracking = 0, spaceScale = 1, className, style }: FaceProps & { atlas: Atlas }) {
  const label = String(children);
  const text = atlas.mask ? label : label.toUpperCase();
  const chars = [...text];
  const rows = Math.max(1, Math.ceil(atlas.charset.length / atlas.cols));
  // source-px count → rendered CSS length: a vh-ish unit when given, else px.
  const len = (n: number) => (unit ? `calc(${unit} * ${n})` : `${n * scale}px`);
  const gw = len(atlas.gw);
  const gh = len(atlas.gh);
  // Layout step per glyph — `advance` (≤ gw) tightens letter-spacing; the glyph
  // bitmap still samples a full `gw`-wide cell, clipped to this width.
  const cellW = len(atlas.advance ?? atlas.gw);
  const sheetW = len(atlas.cols * atlas.gw);
  const sheetH = len(rows * atlas.gh);

  return (
    <span
      role="img"
      aria-label={label}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        lineHeight: 0,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        // marginRight (not flex `gap`) so callers can pass negative tracking to
        // tighten the monospace cells — `gap` clamps negatives to 0.
        const mr = i < chars.length - 1 ? tracking : 0;
        if (ch === " ") {
          // Blank cell — render it narrower than a full glyph so word gaps
          // don't read as oversized.
          return <span key={i} aria-hidden style={{ display: "inline-block", width: len(atlas.gw * spaceScale), height: gh, marginRight: mr }} />;
        }
        const idx = atlas.charset.indexOf(ch);
        if (idx < 0) {
          return <span key={i} aria-hidden style={{ display: "inline-block", width: gw, height: gh, marginRight: mr }} />;
        }
        const c = idx % atlas.cols;
        const r = Math.floor(idx / atlas.cols);
        const posX = len(-(c * atlas.gw));
        const posY = len(-(r * atlas.gh));
        const size = `${sheetW} ${sheetH}`;
        const cell: CSSProperties = atlas.mask
          ? {
              display: "inline-block",
              width: cellW,
              height: gh,
              marginRight: mr,
              backgroundColor: "currentColor",
              WebkitMaskImage: `url("${atlas.src}")`,
              maskImage: `url("${atlas.src}")`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: size,
              maskSize: size,
              WebkitMaskPosition: `${posX} ${posY}`,
              maskPosition: `${posX} ${posY}`,
              imageRendering: "pixelated",
            }
          : {
              display: "inline-block",
              width: cellW,
              height: gh,
              marginRight: mr,
              backgroundImage: `url("${atlas.src}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: size,
              backgroundPosition: `${posX} ${posY}`,
              imageRendering: "pixelated",
            };
        return <span key={i} aria-hidden style={cell} />;
      })}
    </span>
  );
}

const ASCII_ATLAS: Atlas = { src: ASCII_SRC, charset: ASCII_CHARSET, cols: ASCII_COLS, gw: ASCII_GW, gh: ASCII_GH, advance: 7, mask: true };
const OUTLINE_ATLAS: Atlas = { src: OUTLINE_SRC, charset: OUTLINE_CHARSET, cols: OUTLINE_COLS, gw: OUTLINE_GW, gh: OUTLINE_GH, mask: false };

/** General pixel-bitmap label — colour follows `color` (defaults to currentColor). */
export function BitmapText({ scale = 2, ...props }: Partial<Pick<FaceProps, "scale">> & Omit<FaceProps, "scale">) {
  return <BitmapFace atlas={ASCII_ATLAS} scale={scale} {...props} />;
}

/** Chunky outlined display face — for titles and headings. Caps only; input is upper-cased.
 *  Glyphs run edge-to-edge in their 8px cells (black outline on both sides), so cells laid
 *  flush would show a doubled outline between letters. `tracking` defaults to `-scale`: a
 *  one-source-pixel overlap that merges those two outline columns into one. Pass a value to
 *  loosen (positive) or tighten further (more negative). */
export function TitleText({ scale = 4, tracking, ...props }: Partial<Pick<FaceProps, "scale" | "tracking">> & Omit<FaceProps, "scale" | "tracking">) {
  return <BitmapFace atlas={OUTLINE_ATLAS} scale={scale} tracking={tracking ?? -scale} {...props} />;
}
