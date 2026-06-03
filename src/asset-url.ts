/**
 * Normalise a static-image import to a usable URL string.
 *
 * A bare bundler (Vite, raw webpack `asset/resource`) resolves `import x from
 * "./x.png"` to the URL string directly. Next.js resolves it to a
 * `StaticImageData` object (`{ src, width, height, ... }`) via its image
 * loader. The kit's components only need the URL for `url(...)` / `mask-image`,
 * so accept either shape and return the string.
 */
export function assetUrl(mod: string | { src: string }): string {
  return typeof mod === "string" ? mod : mod.src;
}
