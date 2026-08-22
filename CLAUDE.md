# @domin8/arcade-kit

Shared pixel-art arcade UI for the **Domin8 hub** and its games. One canonical home for the retro 9-slice button, panels, fields, bitmap fonts, the cabinet `postMessage` bridge, and their PNG assets — so every repo renders identical chrome instead of carrying its own divergent copy.

Consumers = every repo whose `package.json` pins `arcade-kit#v…`. Derive the live list with `grep -H "arcade-kit#v" */package.json` from the Domin8 root rather than trusting a list here; today it is the v1 set (hub, arena, RR-Casino, janken) plus the deferred `flip`, which stays frozen on an older tag on purpose.

The package **ships TS/TSX source** (no build step) and **imports its PNGs as modules** — so each consumer bundles the sprites with its own hashed URLs. No `/public` copying.

## Package manager & layout

- **Bun** (`bun.lock` present). Only script is `bun run typecheck` (`tsc --noEmit`) — run before tagging a release.
- Source lives entirely in `src/`. `package.json` `files: ["src"]` ships it raw; there's no dist/build.
- **Asset naming (convention across all Domin8 repos):** first-party brand/UI/shared sprites are `d8-<name>.png`, **lowercase kebab-case, no spaces/caps/underscores** (`d8-button-fill.png`, `d8-panel-bg.png`, `d8-font-basic-8x8.png`, `d8-glove-pointer.png`, `d8-vault-big.png`). Third-party packs/fonts keep their upstream names (just de-spaced/lowercased). Assets are imported as modules and re-exported as URL constants from `index.ts` — rename the file + its single import line together.
- `tsconfig.json`: strict, `moduleResolution: "Bundler"`, `jsx: react-jsx`, `noEmit`.

## Exports

Subpath entries (all resolve straight to source):

- **`@domin8/arcade-kit`** → `src/index.ts` — DOM/React kit.
- **`@domin8/arcade-kit/pixi`** → `src/pixi/index.ts` — Pixi adapter. Pulls in `pixi.js` (an *optional* peer dep), so DOM-only consumers that import only the root never load Pixi.
- **`@domin8/arcade-kit/game`** → `src/game.ts` — shared **game art** (NOT UI chrome): fighter spritesheets (`CHARACTER_ATLASES`), VFX atlases (`FIGHT_EFFECT_ATLAS`, `BLOOD_ATLAS`), props (`THRONE_URL`, `CARROT_URL` + `CARROT_SIZE` — RR's carrot, the season pass' free-round icon; tall 13x29, size it by height) and the animated gold loot box (`LOOT_BOX_ATLAS` — arena's prize chest, the season-pass chest) for the Pixi brawlers (arena; flip when un-deferred) and any DOM surface that draws atlas frames on a canvas. On a separate subpath so DOM-only root consumers don't pull in game sprites. Each spritesheet is `{ texture: <png url>, atlas: <parsed Aseprite json> }` — feed both into your Pixi loader (atlas is `unknown`; cast at the call site). Assets live in `src/assets/game/`. Needs `resolveJsonModule` (set in tsconfig).
- **`@domin8/arcade-kit/sfx`** → `src/sfx.ts` — shared **cross-game one-shots** (`SFX_URLS` keys them all: insertCoin, chestBlow, riser, chimeWin, chimeTick, coin, coinDrop, impact, powerUp, fanfare, blast, plus the synthesised UI layer: whoosh, uiClick, modalOpen, modalClose, chatBlip, tick, lose, matchFound — and `IMPACT_SFX_URLS`, the 7-hit melee pool — plus `CHEST_REVEAL_SFX`, the ready-made set for the chest ceremony) as embedded `data:` URLs (bundlers won't module-import `.mp3` without per-consumer loader config, so the web-font embed pattern applies). Own subpath so only games that import it carry the bytes; **budget ~32 KB per sfx** — music and long stingers stay in each game's `public/`, never here. Every entry is re-encoded mono 32 kHz mp3, which is what keeps it inside the budget (`ffmpeg -i in.wav -ac 1 -ar 32000 -b:a 56k out.mp3`). Sources live in `src/assets/audio/`; regeneration one-liner at the top of `src/sfx-data.ts`. Half the bank is **synthesised, not recorded** — `tools/synth-sfx.py` (stdlib Python, ~0.1 s for the set) builds the UI sounds from square/triangle oscillators and an NES-style LFSR noise channel, because the arcade's libraries had nothing for a whoosh/click/blip and a generated sound carries no licence. Retune a recipe there, re-run, re-encode, re-embed; it leaves ~28% headroom because mp3's inter-sample peaks overshoot a normalised source. Audition the whole bank in the hub's Storybook (`Arcade/Sound bank`). Games should construct the `Audio` element lazily at first play so a muted player never pays for the bytes.

## Asset layout (`src/assets/`)

`fonts/` (bitmap-font atlases + the woff2), `ui/` (buttons, panels, chat bubble, glove, nav arrows, dither gradients), `sprites/` (golden coin, vault, gold cup, plus `jewels/` and `bars/` — the loot props), `audio/` (raw mp3 sources for `/sfx`), `game/` (fighter/VFX atlases, hp bars, props). First-party files are `d8-<kebab>.<ext>`; every asset is consumed via an exported URL constant, never deep-imported by consumers.

### DOM kit (`src/index.ts`)
- `NineSliceButton` (`nine-slice-button.tsx` + `.css`) — imports its own interaction CSS, no global stylesheet needed. `highlightColor` recolours the outline's inner gloss (painted through the split `highlight` sprite as a mask; default stays the baked white).
- `NineSlicePanel` / `NineSlicePanelVariant` (`nine-slice-panel.tsx`) — has a `color` prop + cash-out green variant. It publishes its own face through `PanelFaceContext` (`panel-face.ts`), so chrome sitting on a panel can cut its tone from the panel's: `CloseButton` reads it and paints a much darker version of the same colour, with the glyph AND the button gloss re-cut from the same hue much lighter and more saturated (`adjustColor`, HSL — not a mix toward white, which greys the hue out). Outside a panel the [X] takes `panelColor`, or falls back to slate. A panel can also declare its **accent** (`accent` prop — the one bright colour it already uses to say "this is the thing": the shop's carrot, the vault's gold, the pass's cyan), published through `PanelAccentContext`; the [X] paints its glyph and gloss in it, falling back to the derived tone when a panel names none. `usePanelFace` / `usePanelAccent` / `mixColor` / `adjustColor` / `colorLightness` are exported for anything else that needs the same trick.
- `NineSliceField` (`nine-slice-field.tsx` + `.css`).
- `BitmapText`, `TitleText` (`bitmap-font.tsx`) — `BitmapText` uses `basicpixel_8x8.png` as a CSS mask (color inherits); `TitleText` uses `font-8x7-outline.png` as a background image (own palette, auto upper-cased).
- **Typography system** (`typography.ts`) — `TYPE_SCALE` (named size scale) + `TypeRole` + `FONT_CELL`. See **Typography** below. The single source of truth for font roles + sizes, shared by the DOM, Pixi and canvas renderers.
- `drawBitmapText` / `measureBitmapText` / `loadBitmapFontImage` (`canvas-text.ts`) — a canvas-2D renderer for the basic (body) pixel font, for surfaces that draw text straight onto a `<canvas>` (e.g. the hub's CRT attract/leaderboard screens) so they use the kit font instead of a web font.
- `loadPixelWebFont` / `PIXEL_FONT_FAMILY` (`web-font.ts`) — the kit pixel face as a real **web font** (`assets/d8-pixel.woff2`, generated from the same `basicpixel_8x8` atlas). Lets CSS-styled DOM text + wrapping prose use the kit pixel face via a normal `font-family`, matching `BitmapText`. Call `loadPixelWebFont()` once on the client; set `font-family: PIXEL_FONT_FAMILY` (`"D8 Pixel"`) or point a `--font-pixel` CSS var at it. Monospace 8px cell — crispest at font sizes that are multiples of 8px.
- `assetUrl` (`asset-url.ts`) — normalises a PNG import that's either a URL string (bare bundler) or a Next `StaticImageData` object.
- `GOLDEN_COIN_URLS` (`coins.ts`) — the six-frame golden-coin spin as resolved URLs (source in `assets/d8-golden-coin.aseprite`). One canonical gold coin for every game/hub; the Pixi adapter wraps it in a ready-to-load helper.
- `JEWEL_URLS` / `BAR_URLS` / `TREASURE_SIZES` + `JewelName` / `BarName` (`treasure.ts`) — loot props: eleven cut gems and six metal ingots, for anything that spills, showers or pays out (the hub's intro treasure rain). Unlike `GOLDEN_COIN_URLS` these are STILL images, not spin cycles — variety comes from picking different keys, not from stepping frames. Keys are COLOURS/materials, not gem species, and were re-derived from the pixels rather than trusted from the source filenames. The set is **not uniform** (jewels 10×12 to 14×14, ingots all 16×12), so size a sprite by HEIGHT and derive its width from `TREASURE_SIZES` — forcing a square box renders the bars as squashed lozenges. Plain URL strings; render `image-rendering: pixelated` at a whole-number scale.
- `VAULT_BIG_URL` / `VAULT_TITLE_URL` (`vault.ts`) — the steel vault-door sprite (116×114) + the gold "VAULT" wordmark (54×15) for THE VAULT jackpot UI (hub's `motherlode-counter.tsx`). Plain URL strings; render `image-rendering: pixelated`.
- `GOLD_CUP_URL` + `GOLD_CUP_SIZE` (`trophy.ts`) — the gold trophy cup (20×21 native), the leaderboard's icon: the hub cabinet's control-panel cup button, board headers, rank chips. Taller than it is wide, so size it by one axis and derive the other from `GOLD_CUP_SIZE` rather than forcing a square box. The art carries its own gold palette and dark outline — it reads on a light or dark cap with no tinting. Plain URL string; render `image-rendering: pixelated` at a whole-number scale.
- `ARROW_URLS` + `ARROW_SIZE` + `ArrowDir` (`arrows.ts`) — the four chunky pixel nav arrows (`up`/`down`/`left`/`right`), each sprite already pointing its way so consumers never rotate/mirror. The PNGs are drawn in GREY as a **luminosity model**: `PixelArrow` (`pixel-arrow.tsx`) re-cuts their four tones in any hue at runtime (canvas, cached per direction+colour), so a coloured arrow is the same pixel art, lit — no second sprite. `usePressFlash` is the press feedback they pair with: it holds the flash for a minimum beat on a tap and for the whole of a long press. `tintPixelSprite`/`usePixelTint` are exported for any other greyscale sprite. The hub's cabinet-carousel flanks and the season pass' rail scrollers. Plain URL strings; render `image-rendering: pixelated` at an integer multiple of `ARROW_SIZE`.
- `CHAT_BUBBLE_URL` (`chat-bubble.ts`) / `GLOVE_POINTER_URL` (`glove.ts`) — resolved URLs for the hub's chat-tab icon and the pointing-glove hand (no longer the cabinet's nav arrow — see `ARROW_URLS` — but kept for anything that wants a pointing hand). Plain URL strings (for `<img src>` / `url(...)`), so the hub no longer carries its own `/public` copies.
- Cabinet bridge (`cabinet.ts`): `isCabinet`, `isFreePlay`, `postGameOver`, `postExit`, `postPlayForReal`, type `GameResult`. The other end is the hub (`GAME_ORIGINS` whitelist).
- `PlayForRealButton` (`play-for-real-button.tsx`), `PlayModeToggle` + `PlayMode` (`play-mode-toggle.tsx`).
- `ChestReveal` + `REVEAL_ACCENT` + `RevealRarity`/`RevealPhase` (`chest-reveal.tsx` + `.css`) — THE chest-opening ceremony (hub shop, RR pass, any future loot): a full-screen portal — pixel sunburst tinted by rarity (neutral until the roll is known), the chest rumbling harder and harder (JS-driven, escalates for as long as the roll takes, ≥1.7 s), blow → white flash → the light sucked back into the centre (exponential ease-in) → the prize fades up, the rarity stamp slams on, actions rise, tap/Escape = `onDone`. Sound is opt-in via `sfx` (pass `CHEST_REVEAL_SFX` from `/sfx`) + `sfxMuted`; the rumble is SYNTHESISED (`rumble.ts`, exported as `startRumble`) because it has to track the shake's own escalation for an unpredictable length of time — no asset can. Timing lives in the component's own constants (`RUMBLE_MIN_MS`/`BLOW_MS`/`FLASH_HOLD_MS`/`SUCK_MS`); the phase chain is two effects on purpose — one gate, one timer — because a single effect keyed on the phase cancels its own follow-up timer in the cleanup that its own `setPhase` triggers. The kit owns the stage; the consumer brings the chest (a render prop, phase-aware so it can pop its lid on "blow"), the prize node, the stamp text and any buttons. Sits at z 1000 — an in-iframe game should already hold `domin8:modal` open.
- Renderer-agnostic button geometry (`button-geometry.ts`): `BUTTON_SPRITE_URLS` (fill/outline rest+pressed, plus the outline split into `frame` + `highlight` for tinting the gloss), `UNIT`, `CORNER`, `BEVEL`, `SINK`, `TOP_PRESSED`, `BEVEL_PRESSED` — shared with the Pixi adapter.

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
"@domin8/arcade-kit": "github:Paul-Ollivier/arcade-kit#vX.Y.Z"
```

Bun resolves the `#fragment` as an exact git ref, **not** an npm semver range — `#semver:^1.0.0` does NOT work. Tags follow semver intent (breaking visual/API change → major).

**Never write the current version into this file.** `git tag --sort=-v:refname | head -1` is the only truth; a version in prose is stale the next release. Same for the changelog — `git log`/`git tag` own it.

**Release flow: use the `/kit-release` skill.** It owns the whole recipe (typecheck → bump → tag → push → bump every consumer's pin → install → verify → commit), including how to derive the consumer list. Don't improvise a second one here. The two rules worth knowing up front: nothing auto-updates, so a release isn't done until every v1 consumer's pin has moved; and no downstream may ever point at a branch.

## Gotchas

- **Each Next consumer must transpile it** (`transpilePackages: ["@domin8/arcade-kit"]` in `next.config.ts`) since it ships TSX source.
- **Peer deps**: React 18+ / React-DOM 18+ (built against the hub's React 19 / Next 16); `pixi.js` >=8 is optional, only for `/pixi`.
- **SSR**: cabinet helpers all guard `typeof window === "undefined"` and `post*` no-op when not embedded — safe to call unconditionally.
- **Pixel alignment**: button size is decoupled from pixel size via `pixelScale`/`scale`; match a sibling sprite's native scale (e.g. `pixelScale="0.4vh"`) so pixels line up.
- **`BitmapText` covers printable ASCII 32–126 only** — `×`, `🔑` and emoji render as blank gaps in every consumer. Use `x` and the word `KEYS` until the atlas grows those glyphs.
- Style objects spread into a JSX `style` prop are `CSSProperties`, never `as const` (see the root manual — it breaks the production build, not dev).
