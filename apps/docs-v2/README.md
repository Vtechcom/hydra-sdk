# Hydra SDK Documentation

The published documentation for the Hydra SDK — [hydrasdk.com](https://hydrasdk.com). Built with Nuxt 4, Nuxt UI and Nuxt Content.

> This site supersedes `apps/docs`, which is deprecated and no longer receives content. Write documentation here.

## Content

Content lives in `content/en/**`, organised in five sections:

| Section | Path | Holds |
| --- | --- | --- |
| Getting started | `content/en/1.getting-started` | Installation, quick start, configuration |
| Guides | `content/en/2.guides` | Task-oriented walkthroughs |
| Concepts | `content/en/3.concepts` | How Hydra and the SDK work |
| API | `content/en/4.api` | Per-package reference |
| Resources | `content/en/5.resources` | Changelog, migration, performance |

English only — the site is not translated, unlike the v1 docs.

Release notes go at the top of `content/en/5.resources/1.changelog.md`, with the `(Latest)` marker moved to the newest entry. Before documenting an API, check `sdk-ai-agent/sdk-api-metadata.json` for what actually exists.

## Development

From the repo root:

```bash
pnpm dev:docs-v2   # http://localhost:3003
```

Or from this directory:

```bash
pnpm install
pnpm dev
pnpm build      # production build
pnpm preview    # preview the production build
pnpm lint
pnpm typecheck
```

## Deployment

Deployed to Vercel from this directory as a standalone project (see `vercel.json`), serving `hydrasdk.com` and `www.hydrasdk.com`.
