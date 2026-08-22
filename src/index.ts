export { NineSliceButton } from "./nine-slice-button";
export type { NineSliceButtonProps } from "./nine-slice-button";
export { CloseButton } from "./close-button";
export type { CloseButtonProps } from "./close-button";
export { PanelFaceContext, PanelAccentContext, usePanelFace, usePanelAccent, mixColor, adjustColor, colorLightness } from "./panel-face";
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
export { ARROW_URLS, ARROW_SIZE } from "./arrows";
export type { ArrowDir } from "./arrows";
// The arrows in any colour: the grey PNGs are a luminosity model, tinted at
// runtime. `usePressFlash` is the press feedback they are usually driven by.
export { PixelArrow, usePressFlash, usePixelTint, tintPixelSprite } from "./pixel-arrow";
export type { PixelArrowProps } from "./pixel-arrow";
export { GOLDEN_COIN_URLS } from "./coins";
// Loot props (still images, not spin cycles): cut gems and metal ingots for
// showers, chest reveals and payout celebrations.
export { JEWEL_URLS, BAR_URLS, TREASURE_SIZES } from "./treasure";
export type { JewelName, BarName } from "./treasure";
export { VAULT_BIG_URL, VAULT_SMALL_URL, VAULT_TITLE_URL } from "./vault";
// The leaderboard's gold cup — the hub cabinet's control-panel button, and any
// other surface that needs to say "the board" in one sprite.
export { GOLD_CUP_URL, GOLD_CUP_SIZE } from "./trophy";
export { isCabinet, isFreePlay, postGameOver, postExit, postPlayForReal } from "./cabinet";
export type { GameResult } from "./cabinet";
export { PlayForRealButton } from "./play-for-real-button";
export { PlayModeToggle } from "./play-mode-toggle";
// The shared chest-opening ceremony (full-screen rays → rumble → flash → prize).
export { ChestReveal, REVEAL_ACCENT } from "./chest-reveal";
export type { ChestRevealProps, ChestRevealSfx, RevealRarity, RevealPhase } from "./chest-reveal";
// The ceremony's synthesised rumble, exposed for anything else that wants a
// shake that escalates on its own clock.
export { startRumble, playOneShot } from "./rumble";
export type { Rumble } from "./rumble";
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
