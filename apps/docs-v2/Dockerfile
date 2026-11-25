# syntax=docker/dockerfile:1.7
# Docs site (Nuxt 4 + @nuxt/content) for Coolify.
#
# Build context must be the MONOREPO ROOT (the lockfile and workspace live there):
#   docker build -f apps/docs-v2/Dockerfile .
# In Coolify: Build Pack = Dockerfile, Base Directory = /, Dockerfile Location = /apps/docs-v2/Dockerfile, Port = 3000.
#
# docs-v2 does not depend on any @hydra-sdk/* package, so only its own deps are installed.
# It needs a Node runtime (server routes /raw, MCP, @nuxt/content sqlite via node:sqlite -> Node >= 22),
# so this is NOT a static `generate` build.

FROM node:22-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
WORKDIR /repo

# Manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/docs-v2/package.json apps/docs-v2/package.json
# `postinstall` runs `nuxt prepare`, so the full app sources must be present before install
COPY apps/docs-v2 apps/docs-v2

RUN pnpm install --frozen-lockfile --filter "@hydra-sdk/docs-v2..."

# Node server output (default nitro preset) -> .output/server/index.mjs
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm --filter "@hydra-sdk/docs-v2" run build

# ─────────────────────────────────────────────────────────────────────────────
# Runtime — only the self-contained nitro output
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build /repo/apps/docs-v2/.output ./.output

USER node
EXPOSE 3000

# 127.0.0.1 rather than localhost to avoid the IPv6-first resolution issue
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
