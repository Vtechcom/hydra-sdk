# Hydra SDK - Development Guide

> **Generated:** 2025-11-18  
> **For:** Contributors & Internal Development

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | >=18.x | Runtime environment |
| **pnpm** | >=8.x | Package manager |
| **Git** | Latest | Version control |

### Recommended Tools

- **VS Code** with extensions:
  - TypeScript
  - ESLint
  - Prettier
  - Volar (for Vue/Nuxt)
- **Cardano Node** (for local testing)
- **Hydra Node** (for Layer 2 testing)

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Vtechcom/hydra-sdk.git
cd hydra-sdk
```

### 2. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

This will:
- Install root dependencies
- Install dependencies for all packages
- Install dependencies for all apps
- Run `postinstall` hooks (Nuxt prepare, etc.)

### 3. Build SDK Packages

```bash
pnpm build:packages
```

This builds all SDK packages in dependency order:
1. `@hydra-sdk/cardano-wasm`
2. `@hydra-sdk/core`
3. `@hydra-sdk/bridge`
4. `@hydra-sdk/transaction`

**Output:** `packages/*/dist/` directories with compiled bundles

---

## Development Workflow

### Development Mode

#### Run Documentation Site
```bash
pnpm dev:docs
```
- Starts Nuxt dev server on http://localhost:3000
- Hot reload enabled
- Content changes reflected instantly

#### Run Playground
```bash
pnpm dev:playground
```
- Interactive demo environment
- Live code editing

#### Run Web Client
```bash
pnpm dev:web
```
- Web wallet application

#### Run Node.js Playground (for testing)
```bash
pnpm dev:nodejs
```
- Node.js testing environment
- Useful for SDK testing without browser

### Watch Mode (for SDK development)

SDK packages don't have individual `dev` scripts. To develop SDK packages:

```bash
# In one terminal - watch mode for specific package
cd packages/core
pnpm dev  # Runs tsup --watch --dts

# In another terminal - run your test app
cd apps/nodejs-playground
pnpm dev
```

---

## Build Commands

### Build Everything
```bash
# Build all SDK packages
pnpm build:packages

# Build web client
pnpm build:web
```

### Build Individual Package
```bash
cd packages/core
pnpm build
```

### Generate Static Sites
```bash
# Generate documentation site (SSG)
pnpm docs:generate

# Generate playground (SSG)
pnpm playground:generate
```

**Output:** `.output/public/` directory with static files

---

## Testing

### Run All Tests
```bash
pnpm test:ci
```

This runs:
1. `pnpm build:packages` - Build SDK first
2. `pnpm --filter ./apps/nodejs-playground test:ci` - Run tests

### Run Tests for Specific Package
```bash
cd packages/core
pnpm test         # Run tests
pnpm test:u       # Update snapshots
```

### Test Framework: Vitest

```typescript
// Example test file: packages/core/src/__tests__/wallet.test.ts
import { describe, it, expect } from 'vitest'
import { AppWallet } from '../wallet'

describe('AppWallet', () => {
  it('should create wallet from mnemonic', () => {
    const mnemonic = AppWallet.brew()
    const wallet = new AppWallet({
      networkId: 0,
      key: { type: 'mnemonic', words: mnemonic }
    })
    expect(wallet).toBeDefined()
  })
})
```

### Update Test Snapshots
```bash
pnpm --filter @hydra-sdk/core update:snapshot
```

---

## Code Quality

### Linting
```bash
# Lint all packages
pnpm lint

# Lint specific package
cd packages/core
pnpm lint
```

### Code Formatting
```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm prettier --check "**/*.{ts,tsx,md}"
```

### Pre-commit Hooks
Consider setting up Husky + lint-staged for automatic linting/formatting

---

## Development Scripts Reference

### Root Scripts

| Command | Description |
|---------|-------------|
| `pnpm set:dev` | Set dev environment (loads from source) |
| `pnpm set:prod` | Set prod environment (loads from dist) |
| `pnpm dev:web` | Run web client in dev mode |
| `pnpm dev:playground` | Run playground in dev mode |
| `pnpm dev:docs` | Run docs site in dev mode |
| `pnpm dev:nodejs` | Run nodejs playground in dev mode |
| `pnpm build:packages` | Build all SDK packages |
| `pnpm build:web` | Build web client |
| `pnpm docs:generate` | Generate static docs site |
| `pnpm playground:generate` | Generate static playground |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm test:ci` | Run CI tests |
| `pnpm clean` | Clean all node_modules and build artifacts |

### Package Scripts (packages/*)

| Command | Description |
|---------|-------------|
| `pnpm build` | Build package (tsup + tsc) |
| `pnpm dev` | Watch mode (tsup --watch --dts) |
| `pnpm test` | Run tests |
| `pnpm test:u` | Update test snapshots |
| `pnpm clean` | Clean build artifacts |

---

## Environment Configuration

### Development Environment

The project uses a custom environment switcher:

```bash
# Load packages from source (for development)
pnpm set:dev

# Load packages from dist (for production testing)
pnpm set:prod
```

**What it does:**
- Modifies `tsconfig.json` paths
- Points to `src/` (dev) or `dist/` (prod)

### Environment Variables

Create `.env` files in apps:

```bash
# apps/docs/.env
NUXT_PUBLIC_SITE_URL=https://hydrasdk.com
NUXT_PUBLIC_API_URL=https://api.hydrasdk.com

# apps/playground/.env
NUXT_PUBLIC_CARDANO_NETWORK=preprod
NUXT_PUBLIC_BLOCKFROST_KEY=your_key_here
```

---

## Common Development Tasks

### Add New Utility Function to Core

1. **Create utility file:**
   ```bash
   touch packages/core/src/utils/my-utility.ts
   ```

2. **Implement function:**
   ```typescript
   // packages/core/src/utils/my-utility.ts
   export function myUtility(param: string): string {
     return `Processed: ${param}`
   }
   ```

3. **Export from index:**
   ```typescript
   // packages/core/src/index.ts
   import * as MyUtility from './utils/my-utility'
   export { MyUtility }
   ```

4. **Add tests:**
   ```bash
   touch packages/core/src/__tests__/my-utility.test.ts
   ```

5. **Build & test:**
   ```bash
   cd packages/core
   pnpm build
   pnpm test
   ```

### Add New Package

1. **Create package directory:**
   ```bash
   mkdir -p packages/my-package/src
   cd packages/my-package
   ```

2. **Create package.json:**
   ```json
   {
     "name": "@hydra-sdk/my-package",
     "version": "1.0.0",
     "main": "dist/index.js",
     "module": "dist/index.mjs",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsup && tsc --emitDeclarationOnly",
       "dev": "tsup --watch --dts"
     },
     "dependencies": {
       "@hydra-sdk/core": "workspace:*"
     }
   }
   ```

3. **Create tsconfig.json:**
   ```json
   {
     "extends": "@hydra-sdk/tsconfig/base.json",
     "compilerOptions": {
       "outDir": "./dist"
     },
     "include": ["src"]
   }
   ```

4. **Create tsup.config.ts:**
   ```typescript
   import { defineConfig } from 'tsup'
   export default defineConfig({
     entry: ['src/index.ts'],
     format: ['cjs', 'esm'],
     dts: false,
     splitting: false,
     clean: true
   })
   ```

5. **Update root package.json workspaces** (if needed)

6. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Update Documentation

1. **Edit content:**
   ```bash
   vim apps/docs/content/1.getting-started/index.md
   ```

2. **Preview changes:**
   ```bash
   pnpm dev:docs
   ```

3. **Add Vietnamese translation:**
   ```bash
   vim apps/docs/content/vi/1.getting-started/index.md
   ```

4. **Commit changes:**
   ```bash
   git add apps/docs/content
   git commit -m "docs: update getting started guide"
   ```

---

## Debugging

### Debug SDK in Browser

1. Build package in dev mode:
   ```bash
   cd packages/core
   pnpm dev  # Watch mode
   ```

2. Run playground:
   ```bash
   pnpm dev:playground
   ```

3. Open browser DevTools
4. Add breakpoints in source maps

### Debug SDK in Node.js

1. Create test file:
   ```typescript
   // test.ts
   import { AppWallet } from '@hydra-sdk/core'
   
   const wallet = new AppWallet({ ... })
   console.log(wallet)
   ```

2. Run with Node debugger:
   ```bash
   node --inspect-brk test.ts
   ```

3. Attach VS Code debugger

### Debug Nuxt App

1. Add debugger config to `.vscode/launch.json`:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Nuxt: Debug",
     "runtimeExecutable": "pnpm",
     "runtimeArgs": ["dev:docs"],
     "port": 9229
   }
   ```

2. Start debugging from VS Code

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Rebuild packages
pnpm build:packages

# Clear Nuxt cache
rm -rf apps/docs/.nuxt apps/playground/.nuxt

# Reinstall dependencies
pnpm clean
pnpm install
```

### Issue: TypeScript errors in IDE

**Solution:**
```bash
# Ensure packages are built
pnpm build:packages

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: WASM loading errors

**Solution:**
Check that `@hydra-sdk/cardano-wasm` is properly built:
```bash
cd packages/cardano-wasm
pnpm build
```

### Issue: Turbo cache issues

**Solution:**
```bash
# Clear Turbo cache
rm -rf .turbo
pnpm build:packages --force
```

---

## Git Workflow

### Branch Naming
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/code-improvement` - Code refactoring
- `test/test-description` - Test additions

### Commit Messages
Follow Conventional Commits:
```
feat(core): add new wallet export function
fix(bridge): resolve WebSocket reconnection issue
docs(readme): update installation instructions
test(transaction): add datum builder tests
```

### Pull Request Process
1. Create feature branch
2. Make changes
3. Add tests
4. Update documentation
5. Run `pnpm lint` and `pnpm test:ci`
6. Create PR with description
7. Wait for CI checks
8. Request review

---

## Release Process

### Version Management (Changesets)

1. **Create changeset:**
   ```bash
   pnpm changeset
   ```
   - Select packages to version
   - Choose version bump (major/minor/patch)
   - Write changelog entry

2. **Version packages:**
   ```bash
   pnpm changeset version
   ```
   - Updates `package.json` versions
   - Updates `CHANGELOG.md`

3. **Build and test:**
   ```bash
   pnpm build:packages
   pnpm test:ci
   ```

4. **Publish:**
   ```bash
   pnpm changeset publish
   ```
   - Publishes to npm
   - Creates git tags

5. **Push changes:**
   ```bash
   git push --follow-tags
   ```

See `PUBLISH_GUIDE.md` for detailed publishing instructions.

---

## Performance Tips

### Faster Installs
```bash
# Use pnpm's frozen lockfile
pnpm install --frozen-lockfile

# Skip optional dependencies
pnpm install --no-optional
```

### Faster Builds
```bash
# Build only changed packages
pnpm build:packages --filter=[HEAD^1]

# Parallel builds (Turbo does this by default)
pnpm build:packages --concurrency=4
```

### Faster Tests
```bash
# Run tests in parallel
pnpm test --pool=threads

# Watch mode for specific test
pnpm test wallet.test.ts --watch
```

---

## Additional Resources

- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Vitest Docs:** https://vitest.dev/
- **Nuxt 3 Docs:** https://nuxt.com/docs
- **Turborepo Docs:** https://turbo.build/repo/docs
- **pnpm Docs:** https://pnpm.io/
- **Cardano Docs:** https://developers.cardano.org/
- **Hydra Docs:** https://hydra.family/head-protocol/

---

**Next:** See [API Reference](./api-reference.md) for detailed API documentation.
