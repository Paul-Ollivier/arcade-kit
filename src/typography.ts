// Shared typography system for the Domin8 hub + games.
//
// TWO faces, ONE scale. The convention, applied everywhere:
//   • NORMAL / body text → the flat "basic" pixel font
//       DOM: <BitmapText>   Pixi: FONT_BODY (= FONT_BASIC)
//     Colour-flexible (the atlas is white, so it tints to any colour, or in the
//     DOM inherits `color`). This is the DEFAULT for labels, values, buttons,
//     paragraphs, nameplates, HUD readouts.
//   • BIG TITLES / display → the bevelled "outline" pixel font
//       DOM: <TitleText>    Pixi: FONT_TITLE (= FONT_OUTLINE)
//     Reserved for hero moments: the logo, GAME OVER, a big win multiplier,
//     status banners. Don't use it for ordinary text.
//
// Sizes come from ONE fixed scale (below) instead of ad-hoc per-call numbers, so
// every surface shares the same rhythm.

/**
 * The type scale. Each value is the **per-source-pixel multiplier** — i.e. the
 * DOM `<BitmapText scale>` prop and the Pixi `node.scale.set(...)` factor — so a
 * given role is the SAME step in DOM and Pixi. The basic (body) font cell is 8px
 * tall, so rendered body height ≈ `step × 8px`. The outline (title) font cell is
 * 12px, so titles render proportionally chunkier at the same step.
 *
 *   <BitmapText scale={TYPE_SCALE.body}>JOIN</BitmapText>      // DOM, 16px
 *   makeBitmapText("3", "display")                              // Pixi, 48px
 */
export const TYPE_SCALE = {
  caption: 1, //  8px — fine print, dense metadata
  body: 2, //    16px — DEFAULT: labels, values, buttons, paragraphs
  heading: 3, //  24px — sub-headings, the prize amount
  title: 4, //    32px — section / panel titles
  display: 6, //  48px — status banners, big callouts
  hero: 8, //     64px — logo, GAME OVER, countdown, jackpot
} as const;

export type TypeRole = keyof typeof TYPE_SCALE;

/** Source-cell height (px) of each face — body (basic) is 8, title (outline) 12.
 *  Used by the Pixi/canvas helpers to set a crisp native base before scaling. */
export const FONT_CELL = { body: 8, title: 12 } as const;
