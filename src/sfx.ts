/**
 * Shared arcade SFX — the one-shots the hub and every cabinet game draw on, so
 * the arcade sounds like ONE machine instead of four. Game-SPECIFIC sounds
 * (janken's voice calls, arena's death screams, RR's footsteps) stay in that
 * game's own `public/` and are lazy-loaded there; only sounds that genuinely
 * belong to more than one surface graduate into the kit.
 *
 * Ships as embedded `data:` URLs (the web-font pattern — see web-font.ts):
 * bundlers won't module-import `.mp3` without per-consumer loader config
 * (Turbopack: "Unknown module type"), and a data URL needs none. The cost is
 * bundle bytes, so this module has a budget: **~32 KB per sound**, which every
 * entry below respects by being re-encoded to mono 32 kHz mp3. The module sits
 * on its own subpath (`@domin8/arcade-kit/sfx`) so only importers carry it.
 * Anything bigger — music beds, long stingers — does NOT belong here; serve it
 * from the game's `public/`.
 *
 * Mute etiquette (matches the domin8:mute buses): build the Audio element
 * lazily at first PLAY, never at boot — `playOneShot` from the root subpath
 * does exactly that — and gate one-shots on `sfxMuted`, loops on `musicMuted`.
 */
import {
  INSERT_COIN_MP3_DATA,
  CHEST_BLOW_MP3_DATA,
  RISER_MP3_DATA,
  CHIME_WIN_MP3_DATA,
  CHIME_TICK_MP3_DATA,
  COIN_MP3_DATA,
  COIN_DROP_MP3_DATA,
  IMPACT_MP3_DATA,
  FANFARE_MP3_DATA,
  BLAST_MP3_DATA,
} from "./sfx-data";

/** The arcade "insert coin" chirp — a bet placed, a game joined. (Origin: the
 *  arena's bet-placed sound, promoted to the kit.) */
export const INSERT_COIN_SFX_URL = INSERT_COIN_MP3_DATA;
/** A short, dry explosion — a chest bursting, a thing destroyed. */
export const CHEST_BLOW_SFX_URL = CHEST_BLOW_MP3_DATA;
/** An upward riser — anticipation into a reveal or a launch. Peaks ~200 ms in. */
export const RISER_SFX_URL = RISER_MP3_DATA;
/** A bright positive chime — a reward landed, a quest claimed. */
export const CHIME_WIN_SFX_URL = CHIME_WIN_MP3_DATA;
/** A quick neutral blip — a tick, a step, a small confirm. */
export const CHIME_TICK_SFX_URL = CHIME_TICK_MP3_DATA;
/** A single coin — a payout increment, money moving. */
export const COIN_SFX_URL = COIN_MP3_DATA;
/** The melee impact POOL (7 hits) — pick at random so repeated blows never
 *  sound looped. Promoted from the arena, which owns the heaviest use of it. */
export const IMPACT_SFX_URLS: readonly string[] = IMPACT_MP3_DATA;
/** One impact, for a single UI thud (a stamp slamming down). */
export const IMPACT_SFX_URL = IMPACT_MP3_DATA[0];
/** A coin landing in the slot — heavier than `coin`, for money that ARRIVES. */
export const COIN_DROP_SFX_URL = COIN_DROP_MP3_DATA;
/** A big low blast — the arena's finale explosion. Trimmed from a 9.8 s,
 *  2.5 MB source to the 4.2 s that carry it, so it fits the embed budget. */
export const BLAST_SFX_URL = BLAST_MP3_DATA;
/** The arena's repeat-bet power-up. Same recording as `riser` — one copy of
 *  the bytes, two names, because the two uses are not the same idea. */
export const POWER_UP_SFX_URL = RISER_MP3_DATA;
/** The win fanfare — a jackpot, a legendary pull, a match won. ~4 s. */
export const FANFARE_SFX_URL = FANFARE_MP3_DATA;

/** Everything above, keyed — handy for a debug panel or a story control. */
export const SFX_URLS = {
  insertCoin: INSERT_COIN_SFX_URL,
  chestBlow: CHEST_BLOW_SFX_URL,
  riser: RISER_SFX_URL,
  chimeWin: CHIME_WIN_SFX_URL,
  chimeTick: CHIME_TICK_SFX_URL,
  coin: COIN_SFX_URL,
  coinDrop: COIN_DROP_SFX_URL,
  impact: IMPACT_SFX_URL,
  powerUp: POWER_UP_SFX_URL,
  fanfare: FANFARE_SFX_URL,
  blast: BLAST_SFX_URL,
} as const;

export type SfxName = keyof typeof SFX_URLS;

/**
 * The default sound set for `ChestReveal` — pass it straight into the
 * component's `sfx` prop so the shop and the season pass open a chest with the
 * same ceremony. The rarity split is deliberate: a common should feel like a
 * ding and a legendary like a win.
 */
export const CHEST_REVEAL_SFX = {
  blow: CHEST_BLOW_SFX_URL,
  flash: RISER_SFX_URL,
  reveal: {
    common: CHIME_WIN_SFX_URL,
    rare: CHIME_WIN_SFX_URL,
    epic: FANFARE_SFX_URL,
    legendary: FANFARE_SFX_URL,
  },
  stamp: IMPACT_SFX_URL,
} as const;
