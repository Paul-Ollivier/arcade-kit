import { Assets, BitmapFont, BitmapText, Cache, Texture } from "pixi.js";
import { assetUrl } from "../asset-url";
import { TYPE_SCALE, FONT_CELL, type TypeRole } from "../typography";
import outlinePng from "../assets/font-8x7-outline.png";
import basicPng from "../assets/basicpixel_8x8.png";

/**
 * Pixi BitmapFonts for the kit's two bundled grid atlases, so games can render
 * the same pixel faces with native `BitmapText` (the Pixi sibling of the DOM
 * `BitmapText` / `TitleText` in `bitmap-font.tsx`). One source of truth for the
 * atlas + charset + metrics, shared by every Pixi game (arena, Rabbit Royale, …)
 * — they no longer copy the PNGs into their own `public/`.
 *
 *   await loadArcadeFonts();
 *   new BitmapText({ text, style: { fontFamily: FONT_OUTLINE, fontSize: 12 } });
 */

/** Chunky outlined display face (font-8x7-outline.png) — caps + digits + a few
 *  symbols, 3-D extrude. The Pixi twin of `TitleText`. */
export const FONT_OUTLINE = "d8-outline";
/** General pixel face (basicpixel_8x8.png) — full printable ASCII. The Pixi twin
 *  of `BitmapText`. The atlas is white, so a BitmapText `fill`/`tint` recolours
 *  it to any colour. */
export const FONT_BASIC = "d8-basic";

// Semantic role aliases (see ../typography.ts). Prefer these in game code so the
// font's ROLE (body vs title) is explicit at the call site.
/** Normal / body text — the flat basic font. */
export const FONT_BODY = FONT_BASIC;
/** Big titles / display — the bevelled outline font. */
export const FONT_TITLE = FONT_OUTLINE;

const OUTLINE_URL = assetUrl(outlinePng);
const BASIC_URL = assetUrl(basicPng);

// Mirrors the charset baked into the outline atlas (see OUTLINE_CHARSET in
// bitmap-font.tsx): 16×4 grid of 8×12 cells, caps + digits + symbols.
const OUTLINE_CHARSET =
  "ABCDEFGHIJKLMNOP" +
  "QRSTUVWXYZ123456" +
  "7890@,.!?:*%)(+-" +
  "/\\=><'\"$ ";

export interface GridBitmapFontSpec {
  /** fontFamily the BitmapText will reference. */
  family: string;
  /** Pixi Assets alias/URL of the already-loaded atlas texture. */
  textureKey: string;
  /** Explicit glyph order, row-major. Ignored when `startCode` is set. */
  chars?: string;
  /** Sequential char codes from here (used instead of `chars`). */
  startCode?: number;
  charCount?: number;
  cellW: number;
  cellH: number;
  charsPerRow: number;
  /** Per-character xAdvance override (defaults to cellW). */
  xAdvanceFor?: (ch: string) => number;
}

/** Register a uniform-grid spritesheet image as a Pixi BitmapFont. Idempotent
 *  per `family`. The atlas texture must already be loaded into Pixi Assets. */
export function registerGridBitmapFont(spec: GridBitmapFontSpec): void {
  if (Cache.has(`${spec.family}-bitmap`)) return;
  const fontTexture = Assets.get<Texture>(spec.textureKey);
  if (!fontTexture) return;

  const chars: Record<string, Record<string, unknown>> = {};
  const total = spec.startCode !== undefined ? spec.charCount! : spec.chars!.length;
  for (let i = 0; i < total; i++) {
    const code = spec.startCode !== undefined ? spec.startCode + i : spec.chars!.charCodeAt(i);
    const ch = String.fromCharCode(code);
    const col = i % spec.charsPerRow;
    const row = Math.floor(i / spec.charsPerRow);
    chars[ch] = {
      id: code, page: 0,
      x: col * spec.cellW, y: row * spec.cellH, width: spec.cellW, height: spec.cellH,
      xOffset: 0, yOffset: 0,
      xAdvance: spec.xAdvanceFor ? spec.xAdvanceFor(ch) : spec.cellW,
      letter: ch, kerning: {},
    };
  }

  const font = new BitmapFont({
    data: {
      baseLineOffset: 0, chars,
      pages: [{ id: 0, file: spec.family }],
      lineHeight: spec.cellH, fontSize: spec.cellH, fontFamily: spec.family,
    } as never,
    textures: [fontTexture],
  });
  Cache.set(`${spec.family}-bitmap`, font);
}

let loadPromise: Promise<unknown> | null = null;

/** Load the kit's two bundled font atlases and register them as Pixi BitmapFonts
 *  (FONT_OUTLINE + FONT_BASIC). Idempotent — the load Promise is memoised, so
 *  calling it from several game boot paths is safe. */
export function loadArcadeFonts(): Promise<unknown> {
  if (loadPromise) return loadPromise;
  loadPromise = Assets.load([OUTLINE_URL, BASIC_URL]).then((res) => {
    for (const url of [OUTLINE_URL, BASIC_URL]) {
      const t = Assets.get<Texture>(url);
      if (t) t.source.scaleMode = "nearest"; // crisp, non-antialiased upscale
    }
    registerGridBitmapFont({
      family: FONT_OUTLINE, textureKey: OUTLINE_URL,
      chars: OUTLINE_CHARSET, cellW: 8, cellH: 12, charsPerRow: 16,
      xAdvanceFor: (ch) => (ch === " " ? 4 : ch === "." || ch === "," ? 5 : 8),
    });
    registerGridBitmapFont({
      family: FONT_BASIC, textureKey: BASIC_URL,
      startCode: 0x20, charCount: 0x7e - 0x20 + 1,
      cellW: 8, cellH: 8, charsPerRow: 10,
      // 7-px advance (1px tighter than the 8-px cell) — the atlas' rightmost
      // column is padding, so glyphs just sit 1px closer.
      xAdvanceFor: () => 7,
    });
    return res;
  });
  return loadPromise;
}

export interface MakeBitmapTextOptions {
  /** Use the bevelled TITLE face (FONT_TITLE) instead of the body face. */
  title?: boolean;
  /** Tint colour (0xRRGGBB). The atlas is white, so this is the rendered colour.
   *  Defaults to white. */
  color?: number;
  /** Extra pixels between glyphs (source px, pre-scale). */
  letterSpacing?: number;
}

/**
 * Build a Pixi `BitmapText` at a named type-scale step, using the kit's shared
 * fonts and the typography convention (body vs title face). Sets a crisp native
 * base `fontSize` (the face's cell height) then `.scale.set(TYPE_SCALE[role])`,
 * so the same role is the same step in DOM and Pixi.
 *
 *   const t = makeBitmapText("READY", "display", { color: 0xffe27a });
 *   const big = makeBitmapText("WINNER", "hero", { title: true });
 *
 * `loadArcadeFonts()` must have resolved first.
 */
export function makeBitmapText(
  text: string | number,
  role: TypeRole = "body",
  opts: MakeBitmapTextOptions = {}
): BitmapText {
  const title = opts.title ?? false;
  const t = new BitmapText({
    // The outline face is caps-only — match TitleText's auto-uppercasing.
    text: title ? String(text).toUpperCase() : String(text),
    style: {
      fontFamily: title ? FONT_TITLE : FONT_BODY,
      fontSize: title ? FONT_CELL.title : FONT_CELL.body,
      fill: opts.color ?? 0xffffff,
      letterSpacing: opts.letterSpacing ?? 0,
    },
  });
  t.scale.set(TYPE_SCALE[role]);
  return t;
}
