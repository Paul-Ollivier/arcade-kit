import { Container, NineSliceSprite, Texture, BitmapText, Assets } from "pixi.js";
import {
  UNIT,
  CORNER,
  BEVEL,
  SINK,
  TOP_PRESSED,
  BEVEL_PRESSED,
} from "../button-geometry";

/**
 * Pixi port of the D8 nine-slice button (the DOM original lives in
 * `nine-slice-button.tsx`). Both renderers share `button-geometry` — the
 * sprites and the CORNER/BEVEL/SINK insets — so they stay pixel-identical.
 *
 * The two 16×16 kit sprites (white FILL silhouette + black/white OUTLINE) are
 * baked with a face→bevel two-tone into ONE texture per colour pair, then drawn
 * as a single NineSliceSprite: corners/bevel/outline stay a fixed pixel size
 * while the flat face stretches — the canvas equivalent of the DOM button's
 * mask-border + border-image. With `sink`, pressing swaps to the pressed twin
 * (cap drops SINK px into its socket, bevel thins) in place — no layout shift.
 *
 * Palette and font are INJECTED (the kit stays game-agnostic): pass
 * `faceColor`/`bevelColor` hex and the `fontFamily` of a registered Pixi
 * BitmapFont. The button sprites must be loaded first via `loadButtonAssets()`.
 */

/** Stable Pixi cache aliases the kit registers the button sprites under. */
export const BUTTON_ASSET_ALIASES = {
  fill:           "d8-arcade-btn-fill",
  outline:        "d8-arcade-btn-outline",
  fillPressed:    "d8-arcade-btn-fill-pressed",
  outlinePressed: "d8-arcade-btn-outline-pressed",
} as const;

const UNIT_LABEL_ADVANCE = 7; // basicpixel advance (px) — 1px tighter than the 8-px cell
const DEFAULT_PIXEL = 3;      // rendered size of one source pixel (chunkiness)
const DEFAULT_INK   = 0x1a1410; // near-black label ink on the bright face

/** Rendered width of `text` (uppercased) in a fixed 8-px-cell bitmap font at
 *  `scale`. The font is assumed monospace (basicpixel), so width is char count. */
export function measureButtonLabel(text: string, scale: number): number {
  return text.length * UNIT_LABEL_ADVANCE * scale;
}

// One baked texture per (face|bevel|pressed) triple, shared across buttons.
const texCache = new Map<string, Texture>();

/** Bake face+bevel+outline into a single 16×16 texture. `pressed` uses the
 *  shifted-down sprites + thinned bevel, encoding the cap-sink in the texture. */
function bakeTexture(face: string, bevel: string, pressed: boolean): Texture {
  const cacheKey = `${face}|${bevel}|${pressed ? 1 : 0}`;
  const cached = texCache.get(cacheKey);
  if (cached) return cached;

  const bevelH     = pressed ? BEVEL_PRESSED : BEVEL;
  const fillKey    = pressed ? BUTTON_ASSET_ALIASES.fillPressed : BUTTON_ASSET_ALIASES.fill;
  const outlineKey = pressed ? BUTTON_ASSET_ALIASES.outlinePressed : BUTTON_ASSET_ALIASES.outline;
  const fillSrc    = Assets.get<Texture>(fillKey).source.resource as CanvasImageSource;
  const outlineSrc = Assets.get<Texture>(outlineKey).source.resource as CanvasImageSource;

  const canvas = document.createElement("canvas");
  canvas.width = UNIT;
  canvas.height = UNIT;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  // Two-tone block (seam at UNIT − bevelH; the thinner pressed lip drops it),
  // clipped to the silhouette (pressed fill masks away the top SINK rows), then
  // the outline frame stamped on top.
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, UNIT, UNIT - bevelH);
  ctx.fillStyle = bevel;
  ctx.fillRect(0, UNIT - bevelH, UNIT, bevelH);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(fillSrc, 0, 0, UNIT, UNIT);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(outlineSrc, 0, 0, UNIT, UNIT);

  const tex = Texture.from(canvas);
  texCache.set(cacheKey, tex);
  return tex;
}

export interface NineButtonOptions {
  /** Bright, saturated face colour (CSS hex). */
  faceColor: string;
  /** Darker bevel / lip colour (CSS hex). */
  bevelColor: string;
  /** A registered Pixi BitmapFont name (fixed 8-px cell, e.g. basicpixel). */
  fontFamily: string;
  /** Label ink. Defaults to near-black for contrast on the bright face. */
  textColor?: number;
  /** Rendered size of one source pixel (design units). Defaults to 3. */
  pixelSize?: number;
  /** Opt into the cap-sink on press (else only a tint darken + 1-px nudge). */
  sink?: boolean;
  onTap?: () => void;
}

export class NineButton {
  readonly container = new Container();
  private sprite: NineSliceSprite;
  private label: BitmapText;
  private face: string;
  private bevel: string;
  private readonly pixel: number;
  private readonly sink: boolean;
  private _w = 0;
  private _h = 0;
  private pressed = false;

  constructor(opts: NineButtonOptions) {
    this.face = opts.faceColor;
    this.bevel = opts.bevelColor;
    this.pixel = opts.pixelSize ?? DEFAULT_PIXEL;
    this.sink = opts.sink ?? false;

    this.sprite = new NineSliceSprite({
      texture:      bakeTexture(this.face, this.bevel, false),
      leftWidth:    CORNER,
      topHeight:    CORNER,
      rightWidth:   CORNER,
      bottomHeight: BEVEL,
    });
    this.sprite.scale.set(this.pixel);
    this.container.addChild(this.sprite);

    this.label = new BitmapText({
      text: "",
      style: { fontFamily: opts.fontFamily, fontSize: UNIT_LABEL_ADVANCE, fill: opts.textColor ?? DEFAULT_INK },
    });
    this.label.anchor.set(0.5);
    this.container.addChild(this.label);

    this.container.eventMode = "static";
    this.container.cursor = "pointer";
    if (opts.onTap) this.container.on("pointertap", opts.onTap);
    this.container.on("pointerdown",      () => this.setPressed(true));
    this.container.on("pointerup",        () => this.setPressed(false));
    this.container.on("pointerupoutside", () => this.setPressed(false));
    this.container.on("pointerout",       () => this.setPressed(false));
  }

  /** Bevel lip height in rendered design units (fixed, regardless of size). */
  get bevelPx(): number {
    return BEVEL * this.pixel;
  }

  get width(): number { return this._w; }
  get height(): number { return this._h; }

  /** Resize. The face stretches; corners/bevel/outline stay crisp. */
  setSize(w: number, h: number): void {
    this._w = w;
    this._h = h;
    this.sprite.width = w / this.pixel;
    this.sprite.height = h / this.pixel;
    this.sprite.position.set(-w / 2, -h / 2);
    this.layoutLabel();
  }

  /** Recolour the face/bevel (re-bakes for the current press state). */
  setColors(faceColor: string, bevelColor: string): void {
    if (faceColor === this.face && bevelColor === this.bevel) return;
    this.face = faceColor;
    this.bevel = bevelColor;
    this.sprite.texture = bakeTexture(this.face, this.bevel, this.sink && this.pressed);
  }

  setLabel(text: string): void {
    this.label.text = text.toUpperCase();
    this.layoutLabel();
  }

  setLabelScale(scale: number): void {
    this.label.scale.set(scale);
    this.layoutLabel();
  }

  /** Enable/disable taps + dim the button (kept visible). */
  setEnabled(enabled: boolean): void {
    this.container.eventMode = enabled ? "static" : "none";
    this.container.alpha = enabled ? 1 : 0.45;
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /** Centre the label on the FACE (above the bevel lip). A sinking button drops
   *  the label the full SINK so it tracks the lowered seam; otherwise a 1-px
   *  tactile nudge. */
  private layoutLabel(): void {
    const nudge = this.pressed ? (this.sink ? SINK : 1) * this.pixel : 0;
    this.label.position.set(0, -this.bevelPx / 2 + nudge);
  }

  private setPressed(pressed: boolean): void {
    if (pressed === this.pressed) return;
    this.pressed = pressed;
    // Slight darken on press (the DOM kit dims the face ~3%).
    this.sprite.tint = pressed ? 0xcccccc : 0xffffff;
    // Sinking buttons swap to the baked pressed texture and retarget the
    // 9-slice insets, so the cap drops into its socket in place (top gap grows,
    // bevel thins, bottom planted) — width/height/position untouched.
    if (this.sink) {
      this.sprite.texture      = bakeTexture(this.face, this.bevel, pressed);
      this.sprite.topHeight    = pressed ? TOP_PRESSED : CORNER;
      this.sprite.bottomHeight = pressed ? BEVEL_PRESSED : BEVEL;
    }
    this.layoutLabel();
  }
}
