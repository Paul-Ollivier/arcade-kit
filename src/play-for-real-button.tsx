"use client";

import { type MouseEvent } from "react";
import { NineSliceButton, type NineSliceButtonProps } from "./nine-slice-button";
import { postPlayForReal } from "./cabinet";

/**
 * Drop-in "PLAY FOR REAL" call-to-action, consistent across every game.
 *
 * Renders the kit's standard 9-slice button (so it's pixel- and font-identical
 * everywhere) with the `domin8:play-for-real` message pre-wired: clicking it
 * asks the hub to open its onboarding flow on top of the running game. Defaults
 * to the kit's money-green; any NineSliceButton prop can be overridden, and a
 * passed `onClick` still runs after the message is posted.
 */
export function PlayForRealButton({
  children,
  onClick,
  color = "#5cd994",
  ...rest
}: NineSliceButtonProps) {
  return (
    <NineSliceButton
      color={color}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        postPlayForReal();
        onClick?.(e);
      }}
      {...rest}
    >
      {children ?? "PLAY FOR REAL"}
    </NineSliceButton>
  );
}
