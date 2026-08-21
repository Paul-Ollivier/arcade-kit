import { assetUrl } from "./asset-url";
import upPng from "./assets/ui/d8-arrow-up.png";
import downPng from "./assets/ui/d8-arrow-down.png";
import leftPng from "./assets/ui/d8-arrow-left.png";
import rightPng from "./assets/ui/d8-arrow-right.png";

export type ArrowDir = "up" | "down" | "left" | "right";

/** The chunky pixel nav arrows — one sprite per direction, already pointing
 *  the way its name says (no rotating/mirroring needed; the shadow falls the
 *  same way on all four). The hub flanks its cabinet carousel with left/right,
 *  the season pass scrolls its rail with them. Render with
 *  `image-rendering: pixelated` at an integer multiple of `ARROW_SIZE`. */
export const ARROW_URLS: Record<ArrowDir, string> = {
  up: assetUrl(upPng),
  down: assetUrl(downPng),
  left: assetUrl(leftPng),
  right: assetUrl(rightPng),
};

/** Native pixel size of each arrow sprite. */
export const ARROW_SIZE: Record<ArrowDir, { w: number; h: number }> = {
  up: { w: 22, h: 25 },
  down: { w: 22, h: 25 },
  left: { w: 23, h: 25 },
  right: { w: 23, h: 25 },
};
