# syntax=docker/dockerfile:1.7
#
# Build context is the MONOREPO ROOT, not apps/playground — the app resolves
# @hydra-sdk/* through pnpm workspace links, so it cannot be built in isolation:
#
#   docker build -f apps/playground/Dockerfile .
#
# or, from apps/playground, `docker compose build` (the compose file already
# points the context at ../..).

# ─────────────────────────────────────────────────────────────────────────────
# Build — installs the workspace, builds the SDK packages, prerenders the app
# ─────────────────────────────────────────────────────────────────────────────
# Debian rather than alpine for the build stage: several build-time dependencies
# ship prebuilt binaries per-platform (sass-embedded, esbuild, @parcel/watcher),
# and glibc is the path with no musl gaps. The stage is discarded anyway — the
# runtime image below is alpine.
FROM node:22-slim AS build

# Nuxt 3.19 requires node ^20.19.0 || >=22.12.0.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /repo

COPY . .

# Only the playground and the workspace packages it depends on. apps/docs and
# apps/docs-v2 stay out of the install (their manifests are still present, which
# is what --frozen-lockfile wants).
# NODE_ENV is deliberately left unset: the build needs devDependencies.
RUN pnpm install --frozen-lockfile --filter "@hydra-sdk/playground..."

# packages/* ship `exports` pointing at src for local development; set:prod
# flips them to dist, which is what the built artifacts actually expose.
RUN pnpm set:prod && pnpm --filter "./packages/*" run build

# Analytics id is compiled into the bundle: this is a static site, so there is
# no server left at runtime to read an env var. Pass it at build time or leave
# it empty and gtag stays disabled (see nuxt.config.ts).
ARG NUXT_PUBLIC_GTAG_ID=""
ENV NUXT_PUBLIC_GTAG_ID=$NUXT_PUBLIC_GTAG_ID

# ssr: false + nitro preset "static" → every route prerendered to .output/public
RUN pnpm --filter "@hydra-sdk/playground" run generate

# ─────────────────────────────────────────────────────────────────────────────
# Runtime — nginx over the prerendered output, no node in the final image
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY apps/playground/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/playground/.output/public /usr/share/nginx/html

EXPOSE 80

# 127.0.0.1, not localhost: /etc/hosts resolves localhost to ::1 first and
# `listen 80` binds IPv4 only, so the IPv6 attempt is refused.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
	CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
