"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { assetUrl } from "./asset-url";
import fillPng from "./assets/button-fill.png";
import "./nine-slice-field.css";

/**
 * D8 standard text input — wears the button's own `button-fill.png` sprite as a
 * flat WHITE 9-slice background, so form fields read as the input sibling of
 * NineSliceButton. The sprite is painted as a `border-image` with the `fill`
 * keyword (crisp rounded corners, the white centre stretched to fill), with the
 * real <input> layered on top, transparent. CORNER / UNIT_H mirror
 * nine-slice-button.tsx so a field and a button of the same `scale`/`height`
 * line up pixel-for-pixel.
 *
 * The value rides the pixel font at 16px (the crisp 2× of its 8-px grid; >=16px
 * also stops iOS Safari zooming on focus). Font is `--font-pixel` with a Press
 * Start 2P fallback — the consumer is expected to load that face.
 */

const FILL_SRC = assetUrl(fillPng);

const UNIT_H = 16; // native full height
const CORNER = 3; // 9-slice corner inset (matches the button silhouette)

export interface NineSliceFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Px size of one source pixel (matches the buttons' `scale`). */
  scale?: number;
  /** Total field height; defaults to the native 16-px unit at the current scale. */
  height?: string;
}

export const NineSliceField = forwardRef<HTMLInputElement, NineSliceFieldProps>(function NineSliceField(
  { scale = 3, height, className, style, ...rest },
  ref,
) {
  const ps = `${scale}px`;
  const u = (n: number) => `calc(${ps} * ${n})`;
  const h = height ?? u(UNIT_H);

  return (
    <div style={{ position: "relative", width: "100%", height: h }}>
      {/* button-fill.png painted as the field background — 9-slice border-image
          with `fill` so the centre stretches and the corners stay crisp. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          imageRendering: "pixelated",
          pointerEvents: "none",
          borderStyle: "solid",
          borderWidth: u(CORNER),
          borderColor: "transparent",
          borderImageSource: `url("${FILL_SRC}")`,
          borderImageSlice: `${CORNER} fill`,
          borderImageWidth: u(CORNER),
          borderImageRepeat: "stretch",
        }}
      />
      <input
        ref={ref}
        className={`nine-field${className ? ` ${className}` : ""}`}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          background: "none",
          border: "none",
          outline: "none",
          color: "#141018",
          fontFamily: "var(--font-pixel, 'Press Start 2P', monospace)",
          fontSize: "16px",
          letterSpacing: "0.02em",
          // White fill is full height, so no vertical padding — the single-line
          // input centres the value vertically. Side padding matches the button.
          padding: `0 ${u(4)}`,
          ...style,
        }}
        {...rest}
      />
    </div>
  );
});
