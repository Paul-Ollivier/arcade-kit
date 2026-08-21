"use client";

import { type ButtonHTMLAttributes, type CSSProperties } from "react";
import { NineSliceButton } from "./nine-slice-button";
import { adjustColor, mixColor, usePanelFace } from "./panel-face";

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
 * The glyph AND the button's gloss (the outline's highlight row) are the same
 * hue again, but much lighter and MORE saturated — re-cut in HSL, not mixed
 * toward white (which would wash the hue out to grey) — so the control stays
 * inside the panel's family top to bottom: a violet panel gets a near-black
 * violet chip with a vivid lavender X and gloss. Still never red — closing a
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

/** How far the face is pushed toward black. Tuned on the extremes: the white
 *  chat panel must not go black, and the vault's already-dark gunmetal must
 *  still read as a distinct chip on its panel. */
const FACE_DARKEN = 0.62;
const BEVEL_DARKEN = 0.78;
/** The glyph + gloss: the panel's hue at this lightness, with its saturation
 *  pushed up by this much (additive, clamped). High and vivid enough to read
 *  on the darkened face whatever the panel was. The boost ramps in with the
 *  panel's OWN saturation (full from INK_CHROMA_RAMP up): a grey/white panel
 *  has no hue worth saturating — its nominal hue is red, and a flat boost
 *  turned the white chat panel's [X] pink — so it just yields a light grey. */
const INK_LIGHTNESS = 0.8;
const INK_SATURATION_BOOST = 0.35;
const INK_CHROMA_RAMP = 0.2;

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
  // mixColor/adjustColor return null for a colour we can't read (gradient, CSS
  // var); in that case fall back rather than emit a broken value.
  const btnFace = (face && mixColor(face, "black", FACE_DARKEN)) ?? SLATE_FACE;
  const vivid =
    (face &&
      adjustColor(face, {
        lightness: INK_LIGHTNESS,
        saturation: (s) => s + INK_SATURATION_BOOST * Math.min(1, s / INK_CHROMA_RAMP),
      })) ??
    null;
  const btnInk = vivid ?? SLATE_INK;
  const btnBevel = (face && mixColor(face, "black", BEVEL_DARKEN)) ?? undefined;

  const placement: CSSProperties = inline
    ? {}
    : { position: "absolute", top: 12, right: 14, zIndex: 3 };
  return (
    <NineSliceButton
      color={btnFace}
      shadowColor={btnBevel}
      textColor={btnInk}
      highlightColor={vivid ?? undefined}
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
