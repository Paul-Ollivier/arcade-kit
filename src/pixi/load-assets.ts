import { Assets } from "pixi.js";
import { BUTTON_SPRITE_URLS } from "../button-geometry";
import { GOLDEN_COIN_URLS } from "../coins";
import { BUTTON_ASSET_ALIASES } from "./nine-button";

/**
 * Register + load the four button sprites (resting + pressed twins) into Pixi's
 * asset cache under the kit's stable aliases, so `NineButton` can bake from
 * them. Idempotent: the load Promise is memoised, so calling it from several
 * game boot paths is safe. Sprites come from the kit's bundled URLs — games no
 * longer need their own copies in `public/`.
 */
let loadPromise: Promise<unknown> | null = null;

export function loadButtonAssets(): Promise<unknown> {
  if (loadPromise) return loadPromise;
  Assets.add({ alias: BUTTON_ASSET_ALIASES.fill,           src: BUTTON_SPRITE_URLS.fill });
  Assets.add({ alias: BUTTON_ASSET_ALIASES.outline,        src: BUTTON_SPRITE_URLS.outline });
  Assets.add({ alias: BUTTON_ASSET_ALIASES.fillPressed,    src: BUTTON_SPRITE_URLS.fillPressed });
  Assets.add({ alias: BUTTON_ASSET_ALIASES.outlinePressed, src: BUTTON_SPRITE_URLS.outlinePressed });
  loadPromise = Assets.load(Object.values(BUTTON_ASSET_ALIASES));
  return loadPromise;
}

/**
 * Stable Pixi aliases for the six golden-coin frames. 1-indexed to match the
 * source frame numbering (`golden-coin-000N.png`), so `GOLDEN_COIN_ALIASES[0]`
 * is frame 1. Read a loaded frame with `Assets.get(GOLDEN_COIN_ALIASES[n])`.
 */
export const GOLDEN_COIN_ALIASES: readonly string[] = GOLDEN_COIN_URLS.map(
  (_, i) => `d8-golden-coin-${i + 1}`,
);

let coinLoadPromise: Promise<unknown> | null = null;

/**
 * Register + load the six golden-coin frames into Pixi's asset cache under the
 * kit's stable aliases (`GOLDEN_COIN_ALIASES`). Idempotent: the load Promise is
 * memoised, so calling it from several boot paths is safe. Frames come from the
 * kit's bundled URLs — games no longer need their own copies in `public/`.
 */
export function loadCoinAssets(): Promise<unknown> {
  if (coinLoadPromise) return coinLoadPromise;
  GOLDEN_COIN_URLS.forEach((src, i) =>
    Assets.add({ alias: GOLDEN_COIN_ALIASES[i], src }),
  );
  coinLoadPromise = Assets.load([...GOLDEN_COIN_ALIASES]);
  return coinLoadPromise;
}
