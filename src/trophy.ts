import { assetUrl } from "./asset-url";
import goldCupPng from "./assets/sprites/d8-gold-cup.png";

/** Native size of the gold cup, in source pixels. Exported alongside the URL
 *  for the same reason `TREASURE_SIZES` is: the sprite is TALLER than it is
 *  wide (20x21), so a consumer that forces it into a square box squashes it.
 *  Size it by one axis and derive the other from these. */
export const GOLD_CUP_SIZE = { w: 20, h: 21 } as const;

/** Resolved URL for the gold trophy cup (20x21 native) — the leaderboard's
 *  icon wherever a surface needs one: the hub cabinet's control-panel cup
 *  button, board headers, rank chips. Render with `image-rendering: pixelated`
 *  and scale by a WHOLE number so the pixels stay uniform; the art carries its
 *  own gold palette and dark outline, so it reads on a light or dark cap
 *  without tinting. */
export const GOLD_CUP_URL = assetUrl(goldCupPng);
