import { assetUrl } from "./asset-url";
import vaultBigPng from "./assets/d8-vault-big.png";
import vaultTitlePng from "./assets/d8-vault-title.png";

/** Resolved URL for the big steel vault-door sprite (116×114 native) — the hero
 *  image for THE VAULT jackpot (banner icon + info-modal hero). Render with
 *  `image-rendering: pixelated` and scale by an integer-ish factor to stay crisp. */
export const VAULT_BIG_URL = assetUrl(vaultBigPng);

/** Resolved URL for the "VAULT" wordmark sprite (54×15 native, gold pixel face) —
 *  the title lockup for THE VAULT banner/modal, in place of plain bitmap text.
 *  Render with `image-rendering: pixelated`. */
export const VAULT_TITLE_URL = assetUrl(vaultTitlePng);
