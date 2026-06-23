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
- **Typography system** (`typography.ts`) — `TYPE_SCALE` (named size scale) + `TypeRole` + `FONT_CELL`. See **Typography** below. The single source of truth for font roles + sizes, shared by the DOM, Pixi and canvas renderers.
- `drawBitmapText` / `measureBitmapText` / `loadBitmapFontImage` (`canvas-text.ts`) — a canvas-2D renderer for the basic (body) pixel font, for surfaces that draw text straight onto a `<canvas>` (e.g. the hub's CRT attract/leaderboard screens) so they use the kit font instead of a web font.
- `loadPixelWebFont` / `PIXEL_FONT_FAMILY` (`web-font.ts`) — the kit pixel face as a real **web font** (`assets/d8-pixel.woff2`, generated from the same `basicpixel_8x8` atlas). Lets CSS-styled DOM text + wrapping prose use the kit pixel face via a normal `font-family`, matching `BitmapText`. Call `loadPixelWebFont()` once on the client; set `font-family: PIXEL_FONT_FAMILY` (`"D8 Pixel"`) or point a `--font-pixel` CSS var at it. Monospace 8px cell — crispest at font sizes that are multiples of 8px.
- `assetUrl` (`asset-url.ts`) — normalises a PNG import that's either a URL string (bare bundler) or a Next `StaticImageData` object.
- `GOLDEN_COIN_URLS` (`coins.ts`) — the six-frame golden-coin spin as resolved URLs (source in `assets/golden-coin.aseprite`). One canonical gold coin for every game/hub; the Pixi adapter wraps it in a ready-to-load helper.
- `CHAT_BUBBLE_URL` (`chat-bubble.ts`) / `GLOVE_POINTER_URL` (`glove.ts`) — resolved URLs for the hub's chat-tab icon and the cabinet's flanking pointing-glove nav arrow. Plain URL strings (for `<img src>` / `url(...)`), so the hub no longer carries its own `/public` copies.
- Cabinet bridge (`cabinet.ts`): `isCabinet`, `isFreePlay`, `postGameOver`, `postExit`, `postPlayForReal`, type `GameResult`. The other end is the hub (`GAME_ORIGINS` whitelist).
- `PlayForRealButton` (`play-for-real-button.tsx`), `PlayModeToggle` + `PlayMode` (`play-mode-toggle.tsx`).
- Renderer-agnostic button geometry (`button-geometry.ts`): `BUTTON_SPRITE_URLS`, `UNIT`, `CORNER`, `BEVEL`, `SINK`, `TOP_PRESSED`, `BEVEL_PRESSED` — shared with the Pixi adapter.

### Pixi adapter (`src/pixi/index.ts`)
- `NineButton` + `measureButtonLabel` + `BUTTON_ASSET_ALIASES` (`pixi/nine-button.ts`), `loadButtonAssets` + `loadCoinAssets` + `GOLDEN_COIN_ALIASES` (`pixi/load-assets.ts`), `loadArcadeFonts` / `registerGridBitmapFont` / `FONT_OUTLINE` / `FONT_BASIC` (`pixi/bitmap-fonts.ts`). Shares `button-geometry` with the DOM kit. `loadCoinAssets()` registers the six golden-coin frames under `GOLDEN_COIN_ALIASES` (read a frame with `Assets.get(GOLDEN_COIN_ALIASES[n])`).
- `FONT_BODY` / `FONT_TITLE` (semantic aliases of `FONT_BASIC` / `FONT_OUTLINE`) + `makeBitmapText(text, role, { title?, color? })` (`pixi/bitmap-fonts.ts`) — builds a Pixi `BitmapText` at a `TYPE_SCALE` step using the right face. Re-exports `TYPE_SCALE` / `FONT_CELL` / `TypeRole`.

## Typography

ONE system, owned by the kit, used by the hub + every game. **Two faces, one scale:**

- **Normal / body text → the flat basic font.** DOM `<BitmapText>`, Pixi `FONT_BODY`, canvas `drawBitmapText`. The default for labels, values, buttons, paragraphs, nameplates, HUD readouts. The `basicpixel_8x8.png` atlas is **white**, so it tints to any colour (Pixi/canvas `fill`/tint; DOM inherits `color`) — light text on dark, dark on light.
- **Big titles / display → the bevelled outline font.** DOM `<TitleText>`, Pixi `FONT_TITLE`. Reserved for hero moments (logo, GAME OVER, big win multiplier, status banners). Not for ordinary text.

**Sizes** come from `TYPE_SCALE` (in `typography.ts`), never ad-hoc numbers. Each value is the per-source-pixel multiplier — the DOM `scale` prop and the Pixi `.scale.set()` factor — so a role is the SAME step in DOM and Pixi (body cell is 8px → height ≈ `step × 8px`):

| role | step | ≈px (body) | use |
|------|------|-----|-----|
| `caption` | 1 | 8 | fine print, dense metadata |
| `body` | 2 | 16 | **default** |
| `heading` | 3 | 24 | sub-headings, prize amount |
| `title` | 4 | 32 | section / panel titles |
| `display` | 6 | 48 | status banners, big callouts |
| `hero` | 8 | 64 | logo, GAME OVER, countdown, jackpot |

```tsx
<BitmapText scale={TYPE_SCALE.body}>JOIN</BitmapText>        // DOM, flat body font
<TitleText scale={TYPE_SCALE.hero}>DOMIN8</TitleText>       // DOM, bevel title font
makeBitmapText("3", "display", { color: 0xffe27a })          // Pixi, flat body font
drawBitmapText(ctx, "INSERT COIN", x, y, { role: "body", color: "#f5c518", align: "center" }) // canvas
```

**Recolour note:** `basicpixel_8x8.png` is white (was black). DOM `BitmapText` is unaffected (CSS mask uses alpha only), but **every Pixi `FONT_BASIC` consumer must set an explicit `fill`/`tint`** — untinted now renders white instead of black.

## How consumers depend on it (git tag, NOT npm)

It's a **public git dependency** — no token/SSH needed. Consumers pin a **tag**:

```jsonc
"@domin8/arcade-kit": "github:Paul-Ollivier/arcade-kit#v1.9.0"
```

Bun resolves the `#fragment` as a git ref, **not** an npm semver range — `#semver:^1.0.0` does NOT work. Current published tag: **v1.16.0** (basic/body font advance is back to the full 8px cell — the v1.15.0 1px-tighter spacing was reverted across all renderers; v1.15.x added + made self-contained the pixel **web font** — `loadPixelWebFont`/`PIXEL_FONT_FAMILY`, embedded as a base64 data URL; v1.13.0 formalized the **typography** system — `TYPE_SCALE`, `FONT_BODY`/`FONT_TITLE`, `makeBitmapText`, canvas `drawBitmapText`, recoloured the basic atlas white). Tags follow semver intent (breaking visual/API change → major). After rollout the hub + all games pin v1.14.0.

**Release flow:** bump `version` in `package.json`, commit, `git tag vX.Y.Z`, push tag, then bump the `#vX.Y.Z` ref in each downstream repo's `package.json` deliberately. Downstream upgrades are opt-in — nothing auto-updates.

## Gotchas

- **Each Next consumer must transpile it** (`transpilePackages: ["@domin8/arcade-kit"]` in `next.config.ts`) since it ships TSX source.
- **Peer deps**: React 18+ / React-DOM 18+ (built against the hub's React 19 / Next 16); `pixi.js` >=8 is optional, only for `/pixi`.
- **SSR**: cabinet helpers all guard `typeof window === "undefined"` and `post*` no-op when not embedded — safe to call unconditionally.
- **Pixel alignment**: button size is decoupled from pixel size via `pixelScale`/`scale`; match a sibling sprite's native scale (e.g. `pixelScale="0.4vh"`) so pixels line up.
- Same `as const`-on-`style`-prop hazard as the hub applies — type style objects as `CSSProperties`.
