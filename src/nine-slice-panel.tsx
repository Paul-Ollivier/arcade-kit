"use client";

import { type CSSProperties, type HTMLAttributes, forwardRef, useEffect, useState } from "react";
import { assetUrl } from "./asset-url";
import panelPng from "./assets/d8-panel-bg.png";
import panelCashoutPng from "./assets/d8-panel-cashout-bg.png";
import panelShadePng from "./assets/d8-panel-shade.png";

/**
 * D8 standard panel — a 9-slice pixel-art surface, the sibling of NineSliceButton
 * for modal/dialog backgrounds.
 *
 * Each sprite is a 16×16 frame: a 2-px border (outline + pale top-left highlight
 * + bottom-right shadow) around a flat fill, with transparent rounded corners,
 * painted as a `border-image` with the `fill` keyword so the corners stay crisp
 * at any size while the centre stretches to fill the panel.
 *
 * COLOUR. Two baked `variant` sprites ship (amber default + money-green
 * `"cashout"`), but pass `color` for ANY colour while keeping the baked light/
 * shadow. We separate colour from shading: a neutral `panel-shade.png` holds the
 * highlight (white α) + shadow/outline (black α) on a transparent flat centre,
 * derived from the amber sprite, so it's hue-independent. At runtime we bake the
 * requested colour into a panel sprite on a canvas — fill the panel silhouette
 * with `color`, then composite the shade over it — and feed that data-URL into
 * the same border-image path. Bakes are cached per colour (one canvas per unique
 * colour, shared across every panel + game). Same `border-image` box model as
 * the variant path, so `color` is a drop-in: children, padding, fl/grid layout
 * on the panel all behave identically.
 *
 * Pixel size is decoupled from panel size (same convention as NineSliceButton):
 * `pixelScale` is the rendered size of ONE source pixel as any CSS length;
 * `scale` is the px shorthand (pixelScale = `${scale}px`).
 */

/** Which baked panel sprite to paint: amber default, or the green cash-out frame. */
export type NineSlicePanelVariant = "default" | "cashout";

const SRC: Record<NineSlicePanelVariant, string> = {
  default: assetUrl(panelPng),
  cashout: assetUrl(panelCashoutPng),
};
const SHAPE_SRC = assetUrl(panelPng);       // alpha silhouette (colour ignored when baking)
const SHADE_SRC = assetUrl(panelShadePng);  // hue-independent highlight + shadow + outline

const CORNER = 2; // 9-slice inset — the decorative frame is 2 source px
const DEFAULT_SCALE = 5;

// One baked data-URL per unique colour, shared process-wide.
const bakeCache = new Map<string, string>();

/** Bake `color` into a panel sprite: colour silhouette + shade overlay → data
 *  URL. Browser-only (uses Image + canvas); resolves "" if unavailable. */
function bakePanel(color: string): Promise<string> {
  const cached = bakeCache.get(color);
  if (cached) return Promise.resolve(cached);
  if (typeof document === "undefined") return Promise.resolve("");
  return new Promise((resolve) => {
    const shape = new Image();
    const shade = new Image();
    let loaded = 0;
    const draw = () => {
      const w = shape.naturalWidth || 16;
      const h = shape.naturalHeight || 16;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve("");
      ctx.imageSmoothingEnabled = false;
      // Colour the silhouette: draw the shape, then fill the requested colour
      // through its alpha (keeps the rounded transparent corners).
      ctx.drawImage(shape, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      // Composite the hue-independent shading (highlight lightens, shadow +
      // outline darken) over the flat colour.
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(shade, 0, 0);
      const url = c.toDataURL();
      bakeCache.set(color, url);
      resolve(url);
    };
    const tick = () => { if (++loaded === 2) draw(); };
    const fail = () => resolve("");
    shape.onload = tick; shape.onerror = fail;
    shade.onload = tick; shade.onerror = fail;
    shape.src = SHAPE_SRC;
    shade.src = SHADE_SRC;
  });
}

export interface NineSlicePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered size of one source pixel, as any CSS length (e.g. "0.4vh", "5px"). Overrides `scale`. */
  pixelScale?: string;
  /** Px shorthand for pixelScale (pixelScale = `${scale}px`). */
  scale?: number;
  /** Frame sprite to use. Defaults to the amber `"default"`. Ignored when `color` is set. */
  variant?: NineSlicePanelVariant;
  /** Any CSS colour for the panel fill, keeping the baked light/shadow. Takes
   *  precedence over `variant`. */
  color?: string;
}

export const NineSlicePanel = forwardRef<HTMLDivElement, NineSlicePanelProps>(function NineSlicePanel(
  { pixelScale, scale = DEFAULT_SCALE, variant = "default", color, className, style, children, ...rest },
  ref,
) {
  const ps = pixelScale ?? `${scale}px`;
  const u = (n: number) => `calc(${ps} * ${n})`;

  // For `color`, render the baked sprite once ready; until then fall back to the
  // amber default so SSR and the first client render agree (the swap to the baked
  // colour happens post-mount, which never trips hydration).
  const [bakedSrc, setBakedSrc] = useState<string | null>(() => (color ? bakeCache.get(color) ?? null : null));
  useEffect(() => {
    if (!color) { setBakedSrc(null); return; }
    let alive = true;
    void bakePanel(color).then((url) => { if (alive && url) setBakedSrc(url); });
    return () => { alive = false; };
  }, [color]);

  const src = color ? (bakedSrc ?? SRC.default) : SRC[variant];

  const frame: CSSProperties = {
    position: "relative",
    borderStyle: "solid",
    borderWidth: u(CORNER),
    borderColor: "transparent",
    borderImageSource: `url("${src}")`,
    borderImageSlice: `${CORNER} fill`,
    borderImageWidth: u(CORNER),
    borderImageRepeat: "stretch",
    imageRendering: "pixelated",
  };

  return (
    <div ref={ref} className={className} style={{ ...frame, ...style }} {...rest}>
      {children}
    </div>
  );
});
