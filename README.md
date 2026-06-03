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

It's a private git dependency. Add to a consuming app:

```jsonc
// package.json
"dependencies": {
  "@domin8/arcade-kit": "github:<owner>/arcade-kit#semver:^1.0.0"
}
```

Because the package ships source, each Next.js consumer must transpile it:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ["@domin8/arcade-kit"],
};
```

> **Private-repo installs in CI/Coolify:** the build environment needs read
> access to this repo. Either use an SSH dependency URL with a deploy key, or
> provide a `GITHUB_TOKEN` and rewrite HTTPS auth in the build (e.g.
> `git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"`).

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

Semver. Breaking visual or API changes bump the major; consumers pin a range
(`^1`) and upgrade deliberately. Tag releases (`v1.0.0`) so the `#semver:` range
resolves.

## Compatibility

Peer deps: React 18+ / React-DOM 18+. Built against the hub's React 19 / Next 16.
Asset imports resolve to a URL string (bare bundlers) or a `StaticImageData`
object (Next) — `assetUrl()` normalises both.
