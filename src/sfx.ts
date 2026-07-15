/**
 * Shared arcade SFX — the one-shots every cabinet game reuses (the coin-drop
 * "insert coin" chirp on bet placement, …). Game-SPECIFIC sfx stay in each
 * game's own `public/` and are lazy-loaded there; only genuinely cross-game
 * sounds graduate into the kit.
 *
 * Ships as embedded `data:` URLs (the web-font pattern — see web-font.ts):
 * bundlers won't module-import `.mp3` without per-consumer loader config
 * (Turbopack: "Unknown module type"), and a data URL needs none. The cost is
 * bundle bytes, so this module has a budget: keep each embedded sfx under
 * ~32 KB source (≈43 KB base64) and keep the module on its own subpath
 * (`@domin8/arcade-kit/sfx`) so only games that import it carry it. Anything
 * bigger (music, long stingers) does NOT belong here — serve it from the
 * game's `public/` instead. Raw sources live in `src/assets/audio/`.
 *
 * Mute etiquette (matches the domin8:mute buses): construct the Audio element
 * lazily at first PLAY, not at boot — a player who keeps SFX muted should
 * never pay for the bytes.
 */
import { INSERT_COIN_MP3_DATA } from "./sfx-data";

/** The arcade "insert coin" chirp — plays when a bet is placed / a game is
 *  joined. (Origin: the arena's bet-placed sound, promoted to the kit.) */
export const INSERT_COIN_SFX_URL = INSERT_COIN_MP3_DATA;
