import { Assets } from "pixi.js";
import { BUTTON_SPRITE_URLS } from "../button-geometry";
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
