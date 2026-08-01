# Hydra SDK Playground

Interactive playground for `@hydra-sdk/*` — build, inspect, sign and submit Cardano and Hydra
transactions in the browser, with the equivalent TypeScript generated as you go.

The app is client-only (`ssr: false`) and prerenders to a static site, so it can be served by any
static host.

## Development

Run from the monorepo root so the workspace packages are built first:

```bash
pnpm dev:playground        # http://localhost:3000
```

Or from this directory, once `pnpm install` has run at the root:

```bash
pnpm dev
```

## Production build

```bash
# from the monorepo root
pnpm playground:generate   # → apps/playground/.output/public
```

`playground:generate` runs `set:prod` first, which points the `@hydra-sdk/*` package `exports` at
`dist` instead of `src`.

## Docker

The build context is the **monorepo root** — the app resolves `@hydra-sdk/*` through pnpm workspace
links, so it cannot be built from this directory alone. Compose already handles that:

```bash
# from apps/playground
docker compose up --build           # build the image, serve on http://localhost:3010

docker compose --profile local up   # serve an existing .output/public on :3011, no image build
```

Or without compose:

```bash
# from the monorepo root
docker build -f apps/playground/Dockerfile -t hydra-sdk-playground .
docker run --rm -p 3010:80 hydra-sdk-playground
```

The final image is nginx over the prerendered output — no Node.js at runtime.

### Configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `PLAYGROUND_PORT` | compose, runtime | Host port for the built image. Default `3010`. |
| `PLAYGROUND_LOCAL_PORT` | compose, runtime | Host port for the `local` profile. Default `3011`. |
| `NUXT_PUBLIC_GTAG_ID` | **build time** | Compiled into the bundle — a static site has no server to read env at runtime. Leave empty and analytics stays off. |

Both are read from `apps/playground/.env` if present (see `.env.example`).

```bash
NUXT_PUBLIC_GTAG_ID=G-XXXX docker compose up --build
```

### Domain

The canonical origin is **`https://playground.hydrasdk.com`**, declared once as `SITE_URL` at the top
of `nuxt.config.ts` and reused by the social meta and `site.url`. The card image prints the domain
too, so a rename means re-rendering it (below).

### Social card

`public/images/og-image.png` (1200×630) is generated from `scripts/og-image.html`:

```bash
node scripts/generate-og.mjs
```

It renders the card with the Chromium that Playwright already installed — no extra dependency, and
the source stays in the repo so it can be regenerated when the branding moves.

Because the app is `ssr: false`, the prerendered HTML is a bare SPA shell: **only static head entries
in `nuxt.config.ts` reach a social crawler**, since crawlers do not run JavaScript. That is why the
og/twitter tags live there rather than in `useSeoMeta`, and why every route shares one card.

### nginx

`docker/nginx.conf` covers the two things a Cardano SPA needs beyond static file serving:

- `.wasm` is served as `application/wasm`, which `WebAssembly.instantiateStreaming` requires.
- unresolved routes fall back to `200.html`, since the app is client-rendered.
