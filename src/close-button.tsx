"use client";

import { type ButtonHTMLAttributes, type CSSProperties } from "react";
import { NineSliceButton } from "./nine-slice-button";

/**
 * The ONE close affordance for every modal across the hub and games: a slate
 * nine-slice [X], pinned to the panel's top-right. Centralised here so every
 * panel wears the exact same control instead of each repo rolling its own (raw
 * <button> "✕", differing tones/positions). Slate-only by design — closing a
 * modal is safe/non-destructive, so red stays reserved for real danger.
 *
 * Default: absolutely positioned at the top-right — drop it inside a
 * `position: relative` panel. Pass `inline` to place it in normal flow (e.g. a
 * header row) instead.
 */

// Matches the hub's long-standing slate utility button (ChromeButton "slate").
const SLATE_FACE = "#4a4f52";
const SLATE_INK = "#d6dadb";

export interface CloseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Render in normal flow instead of absolute top-right. */
  inline?: boolean;
}

export function CloseButton({ inline = false, style, ...rest }: CloseButtonProps) {
  const placement: CSSProperties = inline
    ? {}
    : { position: "absolute", top: 12, right: 14, zIndex: 3 };
  return (
    <NineSliceButton
      color={SLATE_FACE}
      textColor={SLATE_INK}
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
