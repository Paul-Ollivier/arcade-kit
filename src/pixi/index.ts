// Pixi adapter entry — imported as `@domin8/arcade-kit/pixi`. Pulls in pixi.js
// (an optional peer dependency), so DOM-only consumers that import only the
// package root never load Pixi. Shares `button-geometry` with the DOM kit.
export { NineButton, measureButtonLabel, BUTTON_ASSET_ALIASES } from "./nine-button";
export type { NineButtonOptions } from "./nine-button";
export { loadButtonAssets, loadCoinAssets, GOLDEN_COIN_ALIASES } from "./load-assets";
export { loadArcadeFonts, registerGridBitmapFont, FONT_OUTLINE, FONT_BASIC, FONT_BODY, FONT_TITLE, makeBitmapText } from "./bitmap-fonts";
export type { GridBitmapFontSpec, MakeBitmapTextOptions } from "./bitmap-fonts";
// Shared typography scale + role convention (re-exported for Pixi consumers).
export { TYPE_SCALE, FONT_CELL } from "../typography";
export type { TypeRole } from "../typography";
