"use client";

import { type CSSProperties } from "react";
import { NineSliceButton } from "./nine-slice-button";

export type PlayMode = "free" | "real";

export interface PlayModeToggleProps {
  /** Which side is currently lit. Controlled — the host owns the state. */
  mode: PlayMode;
  /** Fired with the side the player picked. Only fires for the INACTIVE side
   *  (tapping the already-lit side is a no-op), so the host never gets a
   *  redundant event. Selecting "real" while logged out is the host's cue to
   *  open its login flow — this component stays presentational. */
  onSelect: (mode: PlayMode) => void;
  /** Greys both buttons out and blocks selection. The hub passes this while a
   *  game is up: the iframe froze its mode at launch, so switching mid-game
   *  would only desync the chrome from the running game. */
  disabled?: boolean;
  freeLabel?: string;
  realLabel?: string;
  /** Forwarded to each NineSliceButton (pixel size). Defaults match the hub's
   *  compact "chrome" buttons so the toggle drops into a top-button row. */
  scale?: number;
  labelPixel?: string;
  /** Lit-side face colour (default gold) + unlit-side face / label (default
   *  slate), matching the kit's standard active/inactive toggle palette. */
  activeColor?: string;
  inactiveColor?: string;
  inactiveTextColor?: string;
  className?: string;
  style?: CSSProperties;
}

// Same active/inactive palette the hub uses for its currency tabs (gold lit,
// muted steel idle) so the toggle reads as part of the same control row.
const ACTIVE_COLOR = "#f5c518";
const INACTIVE_COLOR = "#4a4f52";
const INACTIVE_TEXT = "#d6dadb";

/**
 * Always-on FREE | REAL play-mode switch, shared across the hub and every game
 * so the control looks and behaves identically everywhere. A segmented pair of
 * the kit's 9-slice buttons: the lit side wears the gold accent, the other the
 * muted slate. Purely presentational and controlled — the host decides what
 * each selection means (e.g. opening login when an unauthenticated player picks
 * REAL).
 */
export function PlayModeToggle({
  mode,
  onSelect,
  disabled = false,
  freeLabel = "FREE",
  realLabel = "REAL",
  scale = 2,
  labelPixel = "1.5px",
  activeColor = ACTIVE_COLOR,
  inactiveColor = INACTIVE_COLOR,
  inactiveTextColor = INACTIVE_TEXT,
  className,
  style,
}: PlayModeToggleProps) {
  const items: { id: PlayMode; label: string }[] = [
    { id: "free", label: freeLabel },
    { id: "real", label: realLabel },
  ];
  return (
    <div
      role="group"
      aria-label="Play mode"
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style }}
    >
      {items.map(({ id, label }) => {
        const active = id === mode;
        return (
          <NineSliceButton
            key={id}
            type="button"
            scale={scale}
            labelPixel={labelPixel}
            color={active ? activeColor : inactiveColor}
            // Lit side keeps the kit's near-black default label; idle side gets
            // a light label for contrast on slate.
            textColor={active ? undefined : inactiveTextColor}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => {
              if (!active) onSelect(id);
            }}
          >
            {label}
          </NineSliceButton>
        );
      })}
    </div>
  );
}
