import { assetUrl } from "./asset-url";
import vaultBigPng from "./assets/d8-vault-big.png";
import vaultSmallPng from "./assets/d8-vault-small.png";
import vaultTitlePng from "./assets/d8-vault-title.png";

/** Resolved URL for the big steel vault-door sprite (116×114 native, with the
 *  CLOSED plate) — the hero image for THE VAULT info-modal. Render with
 *  `image-rendering: pixelated` and scale by an integer factor to stay crisp. */
export const VAULT_BIG_URL = assetUrl(vaultBigPng);

/** Resolved URL for the small square vault-door sprite (74×74 native, no CLOSED
 *  plate) — the compact banner icon. Render `image-rendering: pixelated`; scale
 *  by a WHOLE number (e.g. ×2 = 148²) so pixels stay uniform. */
export const VAULT_SMALL_URL = assetUrl(vaultSmallPng);

/** Resolved URL for the "VAULT" wordmark sprite (54×15 native, gold pixel face) —
 *  the title lockup for THE VAULT banner/modal, in place of plain bitmap text.
 *  Render with `image-rendering: pixelated`. */
export const VAULT_TITLE_URL = assetUrl(vaultTitlePng);
