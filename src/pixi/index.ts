// Pixi adapter entry — imported as `@domin8/arcade-kit/pixi`. Pulls in pixi.js
// (an optional peer dependency), so DOM-only consumers that import only the
// package root never load Pixi. Shares `button-geometry` with the DOM kit.
export { NineButton, measureButtonLabel, BUTTON_ASSET_ALIASES } from "./nine-button";
export type { NineButtonOptions } from "./nine-button";
export { loadButtonAssets } from "./load-assets";
