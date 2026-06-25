// Shared GAME art (not UI chrome): fighter spritesheets, VFX atlases and props
// used by the Pixi brawler games (arena now; flip when it returns). Centralised
// here so the games stop carrying divergent copies. UI/design-system assets stay
// in the root export — these are deliberately on a separate `/game` subpath so
// DOM-only consumers of the root never pull in game sprites.
//
// Each spritesheet is shipped as { texture: <png url>, atlas: <parsed json> }.
// The PNG resolves to a hashed URL via the consumer's bundler; the Aseprite JSON
// is imported as a parsed object (no runtime fetch). Feed both into your Pixi
// loader — see arena's AssetLoader.loadCharacter / loadAtlas.
import { assetUrl } from "./asset-url";

import orcPng from "./assets/game/orc.png";
import orcJson from "./assets/game/orc.json";
import pepePng from "./assets/game/pepe.png";
import pepeJson from "./assets/game/pepe.json";
import yasuoPng from "./assets/game/yasuo.png";
import yasuoJson from "./assets/game/yasuo.json";
import bonkPng from "./assets/game/bonk.png";
import bonkJson from "./assets/game/bonk.json";
import fishPng from "./assets/game/fish.png";
import fishJson from "./assets/game/fish.json";
import mermaidPng from "./assets/game/mermaid.png";
import mermaidJson from "./assets/game/mermaid.json";
import darthvaderPng from "./assets/game/darthvader.png";
import darthvaderJson from "./assets/game/darthvader.json";
import huggywuggyPng from "./assets/game/huggywuggy.png";
import huggywuggyJson from "./assets/game/huggywuggy.json";
import monkePng from "./assets/game/monke.png";
import monkeJson from "./assets/game/monke.json";

import fightEffectPng from "./assets/game/fight-effect.png";
import fightEffectJson from "./assets/game/fight-effect.json";
import bloodPng from "./assets/game/blood-spritesheet.png";
import bloodJson from "./assets/game/blood-spritesheet.json";

import thronePng from "./assets/game/throne.png";

/** A spritesheet asset: the texture URL + its parsed Aseprite atlas. `atlas` is
 *  left as `unknown` so the kit stays decoupled from any one engine's atlas type
 *  — cast it to your loader's shape at the call site. */
export interface AtlasAsset {
  texture: string;
  atlas: unknown;
}

const atlas = (png: string | { src: string }, json: unknown): AtlasAsset => ({
  texture: assetUrl(png),
  atlas: json,
});

/** Fighter spritesheets, keyed by character name (matches arena's CHARACTERS). */
export const CHARACTER_ATLASES: Record<string, AtlasAsset> = {
  orc: atlas(orcPng, orcJson),
  pepe: atlas(pepePng, pepeJson),
  yasuo: atlas(yasuoPng, yasuoJson),
  bonk: atlas(bonkPng, bonkJson),
  fish: atlas(fishPng, fishJson),
  mermaid: atlas(mermaidPng, mermaidJson),
  darthvader: atlas(darthvaderPng, darthvaderJson),
  huggywuggy: atlas(huggywuggyPng, huggywuggyJson),
  monke: atlas(monkePng, monkeJson),
};

/** The kick-out explosion / bloom spritesheet. */
export const FIGHT_EFFECT_ATLAS: AtlasAsset = atlas(fightEffectPng, fightEffectJson);
/** The blood-splatter spritesheet. */
export const BLOOD_ATLAS: AtlasAsset = atlas(bloodPng, bloodJson);

/** Winner-pose throne prop (single texture, no atlas). */
export const THRONE_URL = assetUrl(thronePng);
