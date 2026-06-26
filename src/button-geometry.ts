import { assetUrl } from "./asset-url";
import outlinePng from "./assets/d8-button-outline.png";
import outlinePressedPng from "./assets/d8-button-outline-pressed.png";
import fillPng from "./assets/d8-button-fill.png";
import fillPressedPng from "./assets/d8-button-fill-pressed.png";

/**
 * Single source of truth for the D8 nine-slice button's sprites and geometry,
 * shared by BOTH renderers — the DOM adapter (`nine-slice-button.tsx`, CSS
 * mask-border + border-image) and the Pixi adapter (`pixi/nine-button.ts`,
 * baked NineSliceSprite). Framework-agnostic on purpose: no React, no Pixi —
 * just native-pixel constants and resolved asset URLs, so changing a number or
 * a sprite here updates every renderer at once.
 *
 * The button is two 16×16 sprites: a white rounded-rect FILL silhouette (masks
 * a face→bevel two-tone) and a black/white OUTLINE frame. The pressed twins
 * shift the cap DOWN by SINK px (a gap opens at the top, the bottom edge holds)
 * and thin the bevel lip, so the button reads as sunk into its socket.
 *
 * The OUTLINE sprite's inner white HIGHLIGHT pixels are baked at 65% alpha
 * (≈166/255) so the gloss reads softer on every button, across both the DOM and
 * Pixi renderers (they share these PNGs). The black frame stays fully opaque.
 * To retune, rebake from the git history's full-alpha original.
 */

// Native-px geometry of the source art (one source pixel; renderers scale it).
export const UNIT          = 16;             // full button height
export const CORNER        = 3;              // resting 9-slice inset — rounded-corner staircase depth
export const BEVEL         = 6;              // resting dark-fill band height (bottom 9-slice inset)
export const SINK          = 2;              // px the cap sinks when pressed
export const TOP_PRESSED   = CORNER + SINK;  // pressed top inset: sink gap + corner (5)
export const BEVEL_PRESSED = BEVEL - SINK;   // pressed bottom inset: thinned lip (4)

/** Resolved URLs for the four button sprites (resting + pressed twins). */
export const BUTTON_SPRITE_URLS = {
  fill:           assetUrl(fillPng),
  outline:        assetUrl(outlinePng),
  fillPressed:    assetUrl(fillPressedPng),
  outlinePressed: assetUrl(outlinePressedPng),
} as const;
