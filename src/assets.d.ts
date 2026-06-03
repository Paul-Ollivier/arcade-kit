// Image-module declarations so the kit type-checks standalone. Consumers
// (Next.js) provide their own richer declarations; a static PNG import resolves
// to a URL string under most bundlers, or to a `{ src }` object under Next's
// image loader. `assetUrl()` normalises both — see ./asset-url.ts.
declare module "*.png" {
  const value: string | { src: string };
  export default value;
}
