// The kit pixel face as a real WEB FONT (vector TTF/WOFF2), generated from the
// SAME `basicpixel_8x8` atlas as the body `BitmapText`. This lets CSS-styled DOM
// text (and wrapping prose like chat) use the kit pixel face via a normal CSS
// `font-family` — so it matches the BitmapText / Pixi / canvas rendering instead
// of a different web font (e.g. "Press Start 2P").
//
//   // once on the client (root layout / a client component):
//   useEffect(() => { loadPixelWebFont(); }, []);
//   // then anywhere in CSS:
//   style={{ fontFamily: PIXEL_FONT_FAMILY }}    // or point --font-pixel at it
//
// Monospace, 8px cell → crispest at font sizes that are multiples of 8px.

/** CSS `font-family` of the kit pixel web font. */
export const PIXEL_FONT_FAMILY = "D8 Pixel";

// Bundler-native asset URL (Vite / webpack 5 / Turbopack all emit the file and
// rewrite this). Avoids a `*.woff2` module-type import, which consumers don't
// declare (Next only types images), so it type-checks everywhere.
const FONT_URL = new URL("./assets/d8-pixel.woff2", import.meta.url).href;
let loaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Register the kit pixel web font with the document so `font-family: 'D8 Pixel'`
 * renders. Idempotent; a no-op on the server (returns a resolved promise). Call
 * once on the client.
 */
export function loadPixelWebFont(): Promise<void> {
  if (typeof document === "undefined" || loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const face = new FontFace(PIXEL_FONT_FAMILY, `url("${FONT_URL}") format("woff2")`);
      await face.load();
      document.fonts.add(face);
      loaded = true;
    } catch {
      // load failed — CSS falls back to the family's own fallback stack
    }
  })();
  return loadPromise;
}
