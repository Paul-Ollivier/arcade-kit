"use client";

import { type CSSProperties, type HTMLAttributes, forwardRef } from "react";
import { assetUrl } from "./asset-url";
import panelPng from "./assets/panel-bg.png";
import panelCashoutPng from "./assets/panel-cashout-bg.png";

/**
 * D8 standard panel — a 9-slice pixel-art surface from the kit's panel sprites,
 * the sibling of NineSliceButton for modal/dialog backgrounds.
 *
 * Each sprite is a 16×16 frame: a 2-px border (outline + pale top-left highlight
 * + bottom-right shadow) around a flat fill, with transparent rounded corners.
 * It's painted as a `border-image` with the `fill` keyword so the corners stay
 * crisp at any size while the centre stretches to fill the panel.
 * `border-color: transparent` keeps the box model on the border — lay out
 * content with normal padding inside.
 *
 * Two `variant`s ship: the default amber frame, and a money-green `"cashout"`
 * frame for the cash-out flow so the panel itself reads as "money out".
 *
 * Pixel size is decoupled from panel size (same convention as NineSliceButton):
 * `pixelScale` is the rendered size of ONE source pixel as any CSS length;
 * `scale` is the px shorthand (pixelScale = `${scale}px`).
 */

/** Which panel sprite to paint: amber default, or the green cash-out frame. */
export type NineSlicePanelVariant = "default" | "cashout";

const SRC: Record<NineSlicePanelVariant, string> = {
  default: assetUrl(panelPng),
  cashout: assetUrl(panelCashoutPng),
};

const CORNER = 2; // 9-slice inset — the decorative frame is 2 source px
const DEFAULT_SCALE = 5;

export interface NineSlicePanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered size of one source pixel, as any CSS length (e.g. "0.4vh", "5px"). Overrides `scale`. */
  pixelScale?: string;
  /** Px shorthand for pixelScale (pixelScale = `${scale}px`). */
  scale?: number;
  /** Frame sprite to use. Defaults to the amber `"default"`. */
  variant?: NineSlicePanelVariant;
}

export const NineSlicePanel = forwardRef<HTMLDivElement, NineSlicePanelProps>(function NineSlicePanel(
  { pixelScale, scale = DEFAULT_SCALE, variant = "default", className, style, children, ...rest },
  ref,
) {
  const ps = pixelScale ?? `${scale}px`;
  const u = (n: number) => `calc(${ps} * ${n})`;

  const frame: CSSProperties = {
    position: "relative",
    borderStyle: "solid",
    borderWidth: u(CORNER),
    borderColor: "transparent",
    borderImageSource: `url("${SRC[variant]}")`,
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
