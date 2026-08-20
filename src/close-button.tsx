"use client";

import { type ButtonHTMLAttributes, type CSSProperties } from "react";
import { NineSliceButton } from "./nine-slice-button";
import { colorLightness, mixColor, usePanelFace } from "./panel-face";

/**
 * The ONE close affordance for every modal across the hub and games: a
 * nine-slice [X] pinned to the panel's top-right. Centralised here so every
 * panel wears the exact same control instead of each repo rolling its own (raw
 * <button> "✕", differing tones/positions).
 *
 * TONE. It is cut from the PANEL's own colour, several stops darker — the panel
 * publishes its face through `PanelFaceContext` and this reads it, so a violet
 * panel gets a near-black violet [X], the amber one a deep brown, the vault's
 * gunmetal an ink-blue. Nothing at the call site changes. Deriving beats the old
 * fixed slate for the same reason the panels stopped being amber-only: one grey
 * chip on nine different faces reads as a part from another machine.
 *
 * The glyph is the same colour lightened instead of a flat white, so the control
 * stays inside the panel's family top to bottom. Still never red — closing a
 * modal is safe, so red stays reserved for real danger.
 *
 * Outside a panel (floating over a canvas, say) pass `panelColor` to name the
 * surface it sits on; with neither, it falls back to the historical slate.
 *
 * Default: absolutely positioned at the top-right — drop it inside a
 * `position: relative` panel. Pass `inline` to place it in normal flow (e.g. a
 * header row) instead.
 */

// The pre-derivation tone, kept for surfaces that aren't panels at all.
const SLATE_FACE = "#4a4f52";
const SLATE_INK = "#d6dadb";

/** How far the face is pushed toward black, and the glyph toward white. Tuned
 *  on the extremes: the white chat panel must not go black, and the vault's
 *  already-dark gunmetal must still read as a distinct chip on its panel. */
const FACE_DARKEN = 0.62;
const BEVEL_DARKEN = 0.78;
/** The glyph is lightened further on an already-dark panel: there the face has
 *  little room left to darken, so the X does the separating. */
const INK_LIGHTEN = 0.55;
const INK_LIGHTEN_DARK = 0.72;
const DARK_PANEL = 0.3; // lightness below which a panel counts as dark

export interface CloseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Render in normal flow instead of absolute top-right. */
  inline?: boolean;
  /** The surface's colour, when this [X] is NOT inside a NineSlicePanel.
   *  Ignored when there is a panel above — the panel always knows better. */
  panelColor?: string;
}

export function CloseButton({ inline = false, panelColor, style, ...rest }: CloseButtonProps) {
  const face = usePanelFace() ?? panelColor ?? null;
  // mixColor returns null for a colour we can't read (gradient, CSS var); in
  // that case fall back rather than emit a broken value.
  const dark = face ? (colorLightness(face) ?? 1) < DARK_PANEL : false;
  const btnFace = (face && mixColor(face, "black", FACE_DARKEN)) ?? SLATE_FACE;
  const btnInk =
    (face && mixColor(face, "white", dark ? INK_LIGHTEN_DARK : INK_LIGHTEN)) ?? SLATE_INK;
  const btnBevel = (face && mixColor(face, "black", BEVEL_DARKEN)) ?? undefined;

  const placement: CSSProperties = inline
    ? {}
    : { position: "absolute", top: 12, right: 14, zIndex: 3 };
  return (
    <NineSliceButton
      color={btnFace}
      shadowColor={btnBevel}
      textColor={btnInk}
      scale={2}
      labelPixel="1.5px"
      aria-label="Close"
      style={{ ...placement, ...style }}
      {...rest}
    >
      X
    </NineSliceButton>
  );
}
