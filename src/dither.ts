import { assetUrl } from "./asset-url";
import ditherGradient64Png from "./assets/d8-dithered-gradient-64x.png";
import ditherGradient32Png from "./assets/d8-dithered-gradient-32x.png";

/**
 * Resolved URLs for the ordered-dither gradient textures (64× and 32× grain).
 *
 * Each is a vertical white→black gradient: white (opaque) at the TOP fading
 * through a Bayer-ordered dither to black (transparent) at the BOTTOM. Use as a
 * **luminance** mask (`mask-mode: luminance`) over a solid fill so the fill
 * dithers out — white shows the fill, black hides it. Render the mask with
 * `image-rendering: pixelated` and an integer-ish `mask-size` so the chunky
 * texels stay crisp. Rotate the element (or flip with `transform: scale(-1)`) to
 * point the fade the other way.
 */
export const DITHERED_GRADIENT_URL = assetUrl(ditherGradient64Png);
export const DITHERED_GRADIENT_32_URL = assetUrl(ditherGradient32Png);
