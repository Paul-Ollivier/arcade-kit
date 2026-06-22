import { assetUrl } from "./asset-url";
import frame1 from "./assets/golden-coin-0001.png";
import frame2 from "./assets/golden-coin-0002.png";
import frame3 from "./assets/golden-coin-0003.png";
import frame4 from "./assets/golden-coin-0004.png";
import frame5 from "./assets/golden-coin-0005.png";
import frame6 from "./assets/golden-coin-0006.png";

/**
 * The six-frame golden-coin spin (native pixel art, source in
 * `assets/golden-coin.aseprite`). Frame order 1→6 is one full spin cycle — step
 * through it for a spinning coin, or pick frames at random for a coin-rain
 * shower. One canonical home so every game/hub shares the same gold coin
 * instead of carrying its own copy. Consumed by RR-Casino's cash-out coin rain;
 * the Pixi adapter exposes a ready-to-load helper (`loadCoinAssets` +
 * `GOLDEN_COIN_ALIASES`).
 */
export const GOLDEN_COIN_URLS: readonly string[] = [
  frame1,
  frame2,
  frame3,
  frame4,
  frame5,
  frame6,
].map(assetUrl);
