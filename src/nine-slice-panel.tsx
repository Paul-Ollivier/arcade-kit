"use client";

import { type CSSProperties, type HTMLAttributes, forwardRef } from "react";
import { assetUrl } from "./asset-url";
import panelPng from "./assets/panel-bg.png";

/**
 * D8 standard panel — a 9-slice pixel-art surface from the kit's `panel-bg.png`
 * sprite, the sibling of NineSliceButton for modal/dialog backgrounds.
 *
 * The sprite is a 16×16 frame: a 2-px border (navy outline + pale top-left
 * highlight + brown bottom-right shadow) around an amber fill, with transparent
 * rounded corners. It's painted as a `border-image` with the `fill` keyword so
 * the corners stay crisp at any size while the amber centre stretches to fill
 * the panel. `border-color: transparent` keeps the box model on the border —
 * lay out content with normal padding inside.
 *
 * Pixel size is decoupled from panel size (same convention as NineSliceButton):
 * `pixelScale` is the rendered size of ONE source pixel as any CSS length;
 * `scale` is the px shorthand (pixelScale = `${scale}px`).
 */

const SRC = assetUrl(panelPng);

const CORNER = 2; // 9-slice inset — the decorative frame is 2 source px
const DEFAULT_SCALE = 5;

export interface NineSlicePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered size of one source pixel, as any CSS length (e.g. "0.4vh", "5px"). Overrides `scale`. */
  pixelScale?: string;
  /** Px shorthand for pixelScale (pixelScale = `${scale}px`). */
  scale?: number;
}

export const NineSlicePanel = forwardRef<HTMLDivElement, NineSlicePanelProps>(function NineSlicePanel(
  { pixelScale, scale = DEFAULT_SCALE, className, style, children, ...rest },
  ref,
) {
  const ps = pixelScale ?? `${scale}px`;
  const u = (n: number) => `calc(${ps} * ${n})`;

  const frame: CSSProperties = {
    position: "relative",
    borderStyle: "solid",
    borderWidth: u(CORNER),
    borderColor: "transparent",
    borderImageSource: `url("${SRC}")`,
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
