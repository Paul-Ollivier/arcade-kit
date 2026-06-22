import { assetUrl } from "./asset-url";
import glovePng from "./assets/pixel-glove_hand-pointing_finger.png";

/** Resolved URL for the pointing-glove sprite (15×20 native, finger points UP) —
 *  the toon hand that flanks the hub's arcade cabinet as carousel nav arrows.
 *  Render with `image-rendering: pixelated`; rotate ±90° to aim the finger. */
export const GLOVE_POINTER_URL = assetUrl(glovePng);
