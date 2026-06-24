export { NineSliceButton } from "./nine-slice-button";
export type { NineSliceButtonProps } from "./nine-slice-button";
export { NineSlicePanel } from "./nine-slice-panel";
export type { NineSlicePanelProps, NineSlicePanelVariant } from "./nine-slice-panel";
export { NineSliceField } from "./nine-slice-field";
export type { NineSliceFieldProps } from "./nine-slice-field";
export { BitmapText, TitleText } from "./bitmap-font";
// Shared typography scale + role convention (used by DOM, Pixi and canvas).
export { TYPE_SCALE, FONT_CELL } from "./typography";
export type { TypeRole } from "./typography";
// Canvas-2D renderer for the basic (body) pixel font — for surfaces that draw
// text straight onto a <canvas> (e.g. the hub's CRT screens).
export { drawBitmapText, measureBitmapText, loadBitmapFontImage } from "./canvas-text";
export type { DrawBitmapTextOptions } from "./canvas-text";
// The kit pixel face as a WEB FONT — for CSS-styled DOM text (matches the
// BitmapText face). Call loadPixelWebFont() once on the client; use
// PIXEL_FONT_FAMILY in `font-family`.
export { loadPixelWebFont, PIXEL_FONT_FAMILY } from "./web-font";
export { assetUrl } from "./asset-url";
export { CHAT_BUBBLE_URL } from "./chat-bubble";
export { DITHERED_GRADIENT_URL, DITHERED_GRADIENT_32_URL } from "./dither";
export { GLOVE_POINTER_URL } from "./glove";
export { GOLDEN_COIN_URLS } from "./coins";
export { isCabinet, isFreePlay, postGameOver, postExit, postPlayForReal } from "./cabinet";
export type { GameResult } from "./cabinet";
export { PlayForRealButton } from "./play-for-real-button";
export { PlayModeToggle } from "./play-mode-toggle";
export type { PlayMode, PlayModeToggleProps } from "./play-mode-toggle";
// Renderer-agnostic button primitives (also consumed by the Pixi adapter at
// `@domin8/arcade-kit/pixi`). Exposed so games can read the shared geometry.
export {
  BUTTON_SPRITE_URLS,
  UNIT,
  CORNER,
  BEVEL,
  SINK,
  TOP_PRESSED,
  BEVEL_PRESSED,
} from "./button-geometry";
