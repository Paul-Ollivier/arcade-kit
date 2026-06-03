# @domin8/arcade-kit

Shared pixel-art arcade UI for the **Domin8 hub** and its games. One canonical
home for the retro button, bitmap fonts, and their sprite assets — so the hub
and each game render identical chrome instead of each repo carrying its own
divergent copy.

The package **ships TypeScript/TSX source** and its PNG assets are **imported as
modules**, not referenced by `/public` path. That means a consuming app gets the
sprites bundled (with its own hashed URLs) automatically — no copying files into
`public/`, no fragile shared-path convention.

## Install

It's a public git dependency — no token or SSH key needed (locally or in CI).
Add to a consuming app:

```jsonc
// package.json
"dependencies": {
  "@domin8/arcade-kit": "github:Paul-Ollivier/arcade-kit#v1.0.0"
}
```

Pin a **tag**, not a range: bun resolves a `github:` dependency's `#fragment`
as a git ref, not an npm semver range (`#semver:^1.0.0` does not work). To
upgrade, bump the tag in `package.json`.

Because the package ships source, each Next.js consumer must transpile it:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ["@domin8/arcade-kit"],
};
```

## Use

```tsx
import { NineSliceButton, BitmapText, TitleText } from "@domin8/arcade-kit";

<NineSliceButton color="#ffd21e" onClick={...}>Play Now</NineSliceButton>
<TitleText scale={7}>DOMIN8</TitleText>
```

`NineSliceButton` imports its own interaction CSS, so no global stylesheet copy
is needed. Pixel size is decoupled from button size via `pixelScale` / `scale` —
match a sibling sprite's native scale (e.g. `pixelScale="0.4vh"`) so pixels line
up.

## Versioning

Tag every release (`v1.0.0`, `v1.1.0`, …) following semver intent — breaking
visual or API changes bump the major. Consumers pin a tag and bump it
deliberately when they want the change. (Git deps can't express npm ranges via
bun; if range-based upgrades become important, publish to GitHub Packages
instead.)

## Compatibility

Peer deps: React 18+ / React-DOM 18+. Built against the hub's React 19 / Next 16.
Asset imports resolve to a URL string (bare bundlers) or a `StaticImageData`
object (Next) — `assetUrl()` normalises both.
