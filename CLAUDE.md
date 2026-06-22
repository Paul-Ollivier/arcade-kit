# @domin8/arcade-kit

Shared pixel-art arcade UI for the **Domin8 hub** and its games (hub, flip, RR-Casino). One canonical home for the retro 9-slice button, panels, fields, bitmap fonts, the cabinet `postMessage` bridge, and their PNG assets — so every repo renders identical chrome instead of carrying its own divergent copy.

The package **ships TS/TSX source** (no build step) and **imports its PNGs as modules** — so each consumer bundles the sprites with its own hashed URLs. No `/public` copying.

## Package manager & layout

- **Bun** (`bun.lock` present). Only script is `bun run typecheck` (`tsc --noEmit`) — run before tagging a release.
- Source lives entirely in `src/`. `package.json` `files: ["src"]` ships it raw; there's no dist/build.
- `tsconfig.json`: strict, `moduleResolution: "Bundler"`, `jsx: react-jsx`, `noEmit`.

## Exports

Two subpath entries (both resolve straight to source):

- **`@domin8/arcade-kit`** → `src/index.ts` — DOM/React kit.
- **`@domin8/arcade-kit/pixi`** → `src/pixi/index.ts` — Pixi adapter. Pulls in `pixi.js` (an *optional* peer dep), so DOM-only consumers that import only the root never load Pixi.

### DOM kit (`src/index.ts`)
- `NineSliceButton` (`nine-slice-button.tsx` + `.css`) — imports its own interaction CSS, no global stylesheet needed.
- `NineSlicePanel` / `NineSlicePanelVariant` (`nine-slice-panel.tsx`) — has a `color` prop + cash-out green variant.
- `NineSliceField` (`nine-slice-field.tsx` + `.css`).
- `BitmapText`, `TitleText` (`bitmap-font.tsx`) — `BitmapText` uses `basicpixel_8x8.png` as a CSS mask (color inherits); `TitleText` uses `font-8x7-outline.png` as a background image (own palette, auto upper-cased).
- `assetUrl` (`asset-url.ts`) — normalises a PNG import that's either a URL string (bare bundler) or a Next `StaticImageData` object.
- `GOLDEN_COIN_URLS` (`coins.ts`) — the six-frame golden-coin spin as resolved URLs (source in `assets/golden-coin.aseprite`). One canonical gold coin for every game/hub; the Pixi adapter wraps it in a ready-to-load helper.
- Cabinet bridge (`cabinet.ts`): `isCabinet`, `isFreePlay`, `postGameOver`, `postExit`, `postPlayForReal`, type `GameResult`. The other end is the hub (`GAME_ORIGINS` whitelist).
- `PlayForRealButton` (`play-for-real-button.tsx`), `PlayModeToggle` + `PlayMode` (`play-mode-toggle.tsx`).
- Renderer-agnostic button geometry (`button-geometry.ts`): `BUTTON_SPRITE_URLS`, `UNIT`, `CORNER`, `BEVEL`, `SINK`, `TOP_PRESSED`, `BEVEL_PRESSED` — shared with the Pixi adapter.

### Pixi adapter (`src/pixi/index.ts`)
- `NineButton` + `measureButtonLabel` + `BUTTON_ASSET_ALIASES` (`pixi/nine-button.ts`), `loadButtonAssets` + `loadCoinAssets` + `GOLDEN_COIN_ALIASES` (`pixi/load-assets.ts`), `loadArcadeFonts` / `registerGridBitmapFont` / `FONT_OUTLINE` / `FONT_BASIC` (`pixi/bitmap-fonts.ts`). Shares `button-geometry` with the DOM kit. `loadCoinAssets()` registers the six golden-coin frames under `GOLDEN_COIN_ALIASES` (read a frame with `Assets.get(GOLDEN_COIN_ALIASES[n])`).

## How consumers depend on it (git tag, NOT npm)

It's a **public git dependency** — no token/SSH needed. Consumers pin a **tag**:

```jsonc
"@domin8/arcade-kit": "github:Paul-Ollivier/arcade-kit#v1.9.0"
```

Bun resolves the `#fragment` as a git ref, **not** an npm semver range — `#semver:^1.0.0` does NOT work. Current published tag: **v1.11.0** (added the shared golden coin). Tags follow semver intent (breaking visual/API change → major). Hub is on v1.10.0; RR is on v1.11.0 (uses the shared coin); flip/arena lag (v1.7.0/v1.9.0).

**Release flow:** bump `version` in `package.json`, commit, `git tag vX.Y.Z`, push tag, then bump the `#vX.Y.Z` ref in each downstream repo's `package.json` deliberately. Downstream upgrades are opt-in — nothing auto-updates.

## Gotchas

- **Each Next consumer must transpile it** (`transpilePackages: ["@domin8/arcade-kit"]` in `next.config.ts`) since it ships TSX source.
- **Peer deps**: React 18+ / React-DOM 18+ (built against the hub's React 19 / Next 16); `pixi.js` >=8 is optional, only for `/pixi`.
- **SSR**: cabinet helpers all guard `typeof window === "undefined"` and `post*` no-op when not embedded — safe to call unconditionally.
- **Pixel alignment**: button size is decoupled from pixel size via `pixelScale`/`scale`; match a sibling sprite's native scale (e.g. `pixelScale="0.4vh"`) so pixels line up.
- Same `as const`-on-`style`-prop hazard as the hub applies — type style objects as `CSSProperties`.
