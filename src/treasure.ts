import { assetUrl } from "./asset-url";

import jewelBlue from "./assets/sprites/jewels/d8-jewel-blue.png";
import jewelIce from "./assets/sprites/jewels/d8-jewel-ice.png";
import jewelTurquoise from "./assets/sprites/jewels/d8-jewel-turquoise.png";
import jewelJade from "./assets/sprites/jewels/d8-jewel-jade.png";
import jewelGreen from "./assets/sprites/jewels/d8-jewel-green.png";
import jewelGreenDeep from "./assets/sprites/jewels/d8-jewel-green-deep.png";
import jewelAmber from "./assets/sprites/jewels/d8-jewel-amber.png";
import jewelOrange from "./assets/sprites/jewels/d8-jewel-orange.png";
import jewelRed from "./assets/sprites/jewels/d8-jewel-red.png";
import jewelPurple from "./assets/sprites/jewels/d8-jewel-purple.png";
import jewelViolet from "./assets/sprites/jewels/d8-jewel-violet.png";

import barGold from "./assets/sprites/bars/d8-bar-gold.png";
import barDirtyGold from "./assets/sprites/bars/d8-bar-dirty-gold.png";
import barSilver from "./assets/sprites/bars/d8-bar-silver.png";
import barTitanium from "./assets/sprites/bars/d8-bar-titanium.png";
import barCoal from "./assets/sprites/bars/d8-bar-coal.png";
import barHell from "./assets/sprites/bars/d8-bar-hell.png";

/**
 * Loot props: cut gems and ingots, for anything that spills, showers or pays out
 * — the hub's intro treasure rain, chest reveals, win celebrations.
 *
 * They are STILL images, not spin cycles: unlike {@link GOLDEN_COIN_URLS} (six
 * frames of one coin) each entry here is a whole distinct object. Variety comes
 * from picking different keys, not from stepping frames — so a shower mixes them
 * rather than animating them.
 *
 * All of them are tiny native pixel art (10–16px) meant to be scaled UP by a
 * whole number with `image-rendering: pixelated`. Sizes differ per sprite and
 * several are non-square, so size them by their own aspect (see
 * {@link TREASURE_SIZES}) instead of forcing a square box — a bar squashed into
 * one reads as a lozenge.
 *
 * Keys are COLOURS, not gem species, because that's what a caller picks by
 * ("something red"). They were re-derived from the pixels rather than trusted
 * from the source filenames — the amber one arrived called "yellow" and the jade
 * one called an "emerald diamond".
 */
export const JEWEL_URLS = {
  blue: assetUrl(jewelBlue),
  ice: assetUrl(jewelIce),
  turquoise: assetUrl(jewelTurquoise),
  jade: assetUrl(jewelJade),
  green: assetUrl(jewelGreen),
  greenDeep: assetUrl(jewelGreenDeep),
  amber: assetUrl(jewelAmber),
  orange: assetUrl(jewelOrange),
  red: assetUrl(jewelRed),
  purple: assetUrl(jewelPurple),
  violet: assetUrl(jewelViolet),
} as const;

/** Metal ingots, dullest to richest is NOT the key order — pick by material. */
export const BAR_URLS = {
  gold: assetUrl(barGold),
  dirtyGold: assetUrl(barDirtyGold),
  silver: assetUrl(barSilver),
  titanium: assetUrl(barTitanium),
  coal: assetUrl(barCoal),
  hell: assetUrl(barHell),
} as const;

export type JewelName = keyof typeof JEWEL_URLS;
export type BarName = keyof typeof BAR_URLS;

/**
 * Native pixel size of every jewel and bar, keyed the same way.
 *
 * Needed because these are NOT a uniform sprite set: jewels run 10×12 to 14×14
 * and every bar is 16×12. Draw with `w = h * (width / height)` (or the reverse)
 * so each keeps its own proportions in a mixed shower.
 */
export const TREASURE_SIZES: Record<JewelName | BarName, { width: number; height: number }> = {
  blue: { width: 14, height: 14 },
  ice: { width: 14, height: 14 },
  turquoise: { width: 12, height: 13 },
  jade: { width: 12, height: 14 },
  green: { width: 10, height: 12 },
  greenDeep: { width: 10, height: 12 },
  amber: { width: 13, height: 14 },
  orange: { width: 14, height: 14 },
  red: { width: 14, height: 14 },
  purple: { width: 14, height: 14 },
  violet: { width: 14, height: 14 },
  gold: { width: 16, height: 12 },
  dirtyGold: { width: 16, height: 12 },
  silver: { width: 16, height: 12 },
  titanium: { width: 16, height: 12 },
  coal: { width: 16, height: 12 },
  hell: { width: 16, height: 12 },
};
