# Hydra SDK - Documentation Index

> **Generated:** 2025-11-18  
> **Project:** hydra-sdk  
> **Type:** Monorepo SDK + Web Apps  
> **Status:** Comprehensive Project Documentation

## 🎯 Quick Start

**New to Hydra SDK?** Start here:
1. Read [Project Overview](./project-overview.md) for high-level understanding
2. Check [Source Tree Analysis](./source-tree-analysis.md) to navigate the codebase
3. Review [Architecture](./architecture-sdk.md) for design patterns
4. Follow [Development Guide](./development-guide.md) to set up your environment

**For AI-Assisted Development:** This index and linked documents provide comprehensive context for code generation, refactoring, and feature development.

---

## 📊 Project Overview

### Quick Reference

- **Repository Type:** Monorepo (pnpm workspaces + Turborepo)
- **Primary Language:** TypeScript 5.x
- **SDK Packages:** 6 libraries
- **Applications:** 3 web apps (Nuxt 3)
- **License:** Apache-2.0
- **Version:** 1.1.3

### Core Packages

| Package | Purpose | Path |
|---------|---------|------|
| `@hydra-sdk/core` | Core Cardano wallet functionality | `packages/core/` |
| `@hydra-sdk/bridge` | Hydra Layer 2 integration | `packages/hydra-bridge/` |
| `@hydra-sdk/transaction` | Transaction builder utilities | `packages/hydra-transaction/` |
| `@hydra-sdk/cardano-wasm` | Cardano WASM bindings | `packages/cardano-wasm/` |
| `@hydra-sdk/eslint-config` | Shared ESLint configuration | `packages/eslint-config/` |
| `@hydra-sdk/tsconfig` | Shared TypeScript configuration | `packages/tsconfig/` |

### Web Applications

| App | Purpose | Technology | Path |
|-----|---------|-----------|------|
| **Docs** | Documentation site | Nuxt 3 + Nuxt Content | `apps/docs/` |
| **Playground** | Interactive demo | Nuxt 3 | `apps/playground/` |
| **Web** | Web wallet client | Nuxt 3 | `apps/web/` |

---

## 📚 Generated Documentation

### Core Documentation

1. **[Project Overview](./project-overview.md)** ✅
   - Executive summary
   - Technology stack
   - Package descriptions
   - Development workflow
   - Key goals and audience

2. **[Source Tree Analysis](./source-tree-analysis.md)** ✅
   - Annotated directory structure
   - Entry points reference
   - Critical directories guide
   - File organization patterns

3. **[Architecture Documentation](./architecture-sdk.md)** ✅
   - System architecture
   - Package architecture (per package)
   - Integration architecture
   - Build & distribution
   - Error handling
   - Testing architecture
   - Security & performance considerations

4. **[Development Guide](./development-guide.md)** ✅
   - Prerequisites & installation
   - Development workflow
   - Build commands
   - Testing
   - Code quality tools
   - Common tasks
   - Debugging tips
   - Git workflow
   - Release process

5. **[API Reference](./api-reference.md)** _(To be generated)_
   - Auto-generated from `sdk-ai-agent/sdk-api-metadata.json`
   - Function signatures
   - Type definitions
   - Usage examples

---

## 📖 Existing Documentation

### Root Level Documentation

- **[README.md](../../README.md)** - Main project README (English)
- **[README_VI.md](../../README_VI.md)** - Main project README (Vietnamese)
- **[PUBLISH_GUIDE.md](../../PUBLISH_GUIDE.md)** - Publishing workflow guide
- **[CARDANO_WASM_IMPLEMENTATION.md](../../CARDANO_WASM_IMPLEMENTATION.md)** - WASM integration details

### Package Documentation

- **[packages/core/README.md](../../packages/core/README.md)** - Core package docs
- **[packages/hydra-bridge/README.md](../../packages/hydra-bridge/README.md)** - Bridge docs (EN)
- **[packages/hydra-bridge/README_VI.md](../../packages/hydra-bridge/README_VI.md)** - Bridge docs (VI)
- **[packages/hydra-transaction/README.md](../../packages/hydra-transaction/README.md)** - Transaction docs
- **[packages/cardano-wasm/README.md](../../packages/cardano-wasm/README.md)** - WASM docs
- **[packages/eslint-config/README.md](../../packages/eslint-config/README.md)** - ESLint config

### Apps Documentation

- **[apps/docs/README.md](../../apps/docs/readme.md)** - Docs site README
- **[apps/docs/content/](../../apps/docs/content/)** - Full documentation site content
  - 1.getting-started/ - Getting Started guides
  - 2.api/ - API reference
  - 3.examples/ - Code examples
  - 4.guides/ - How-to guides
  - 5.packages/ - Package-specific docs
  - 6.hydra-concept/ - Hydra Layer 2 concepts
  - vi/ - Vietnamese translations
- **[apps/playground/README.md](../../apps/playground/README.md)** - Playground docs
- **[apps/web/README.md](../../apps/web/README.md)** - Web client docs (EN)
- **[apps/web/README_VI.md](../../apps/web/README_VI.md)** - Web client docs (VI)

### CI/CD Documentation

- **[.github/workflows/README.md](../../.github/workflows/README.md)** - GitHub Actions workflows

---

## 🤖 AI Agent Resources

### API Metadata

- **[sdk-ai-agent/sdk-api-metadata.json](../../sdk-ai-agent/sdk-api-metadata.json)** (1855 lines)
  - Extracted API metadata for all SDK packages
  - Function signatures with types
  - Parameter descriptions
  - Return type information
  - Generated by `scripts/extract-sdk-api.ts`

**Purpose:** Provides complete API surface for AI-assisted development:
- Code completion suggestions
- Type-aware code generation
- API usage examples
- Integration guidance

---

## 🗂️ Documentation Organization

### By Purpose

| Purpose | Documents |
|---------|-----------|
| **Understanding** | Project Overview, README files |
| **Navigation** | Source Tree Analysis, Index (this file) |
| **Design** | Architecture Documentation |
| **Implementation** | Development Guide, API Reference |
| **Publishing** | PUBLISH_GUIDE.md |
| **Integration** | CARDANO_WASM_IMPLEMENTATION.md |

### By Audience

| Audience | Recommended Reading |
|----------|---------------------|
| **New Contributors** | README → Project Overview → Development Guide |
| **SDK Users** | README → API Reference → Examples (apps/docs/content/3.examples/) |
| **Architects** | Architecture Documentation → Source Tree Analysis |
| **AI Agents** | This Index → All Generated Docs → sdk-api-metadata.json |

---

## 🛠️ Common Use Cases

### Use Case 1: Adding a New Feature to Core Package

**Documents to reference:**
1. [Source Tree Analysis](./source-tree-analysis.md) - Find where to add code
2. [Architecture Documentation](./architecture-sdk.md) - Understand design patterns
3. [Development Guide](./development-guide.md) - Follow development workflow
4. [API Reference](./api-reference.md) - Maintain API consistency

**Workflow:**
```bash
# 1. Navigate to package
cd packages/core

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Add code + tests
touch src/utils/my-feature.ts
touch src/__tests__/my-feature.test.ts

# 4. Update exports in index.ts

# 5. Build & test
pnpm build
pnpm test

# 6. Update documentation
vim README.md
```

### Use Case 2: Creating Brownfield PRD

**Documents to provide as context:**
1. This index (bmm-index.md)
2. [Project Overview](./project-overview.md)
3. [Architecture Documentation](./architecture-sdk.md)
4. [Source Tree Analysis](./source-tree-analysis.md)
5. Relevant package READMEs

**BMad Workflow:**
```bash
# Run BMM workflow with Mary (analyst agent)
*prd

# Provide this index as brownfield context
Context: /docs/technical/bmm-index.md
```

### Use Case 3: Understanding Hydra Integration

**Documents to read:**
1. [packages/hydra-bridge/README.md](../../packages/hydra-bridge/README.md)
2. [Architecture Documentation - Bridge Section](./architecture-sdk.md#bridge-package-hydra-sdkbridge)
3. [apps/docs/content/6.hydra-concept/](../../apps/docs/content/6.hydra-concept/)
4. [apps/docs/content/3.examples/](../../apps/docs/content/3.examples/) - Look for Hydra examples

---

## 🔄 Workflow Status Tracking

### BMM Workflow

**Status File:** `../bmm-workflow-status.yaml`

**Current Status:**
- **Track:** BMad Method
- **Field Type:** Brownfield
- **Next Workflow:** brainstorm-project (optional) or prd (required)

**Prerequisites:**
- ✅ **document-project** - This documentation suite (COMPLETED)

**Next Steps:**
1. Review generated documentation
2. Run `*brainstorm-project` for creative exploration (optional)
3. Run `*prd` to create Product Requirements Document
4. Follow BMM workflow path in `bmm-workflow-status.yaml`

---

## 📈 Documentation Coverage

### Coverage Summary

| Category | Status | Files |
|----------|--------|-------|
| **Project Overview** | ✅ Complete | 1 |
| **Source Tree** | ✅ Complete | 1 |
| **Architecture** | ✅ Complete | 1 |
| **Development Guide** | ✅ Complete | 1 |
| **API Reference** | ⚠️ To be generated | 0 |
| **Package READMEs** | ✅ Existing | 6 |
| **App READMEs** | ✅ Existing | 3 |
| **Content Docs** | ✅ Existing | ~50+ |

### Incomplete Documentation

Items marked _(To be generated)_:

1. **API Reference** - Comprehensive API documentation
   - Source: `sdk-ai-agent/sdk-api-metadata.json`
   - Format: Markdown with function signatures
   - Auto-generate from metadata

**To generate API Reference:**
```bash
# Future workflow
*generate-api-docs
```

---

## 🔍 Search & Navigation Tips

### Finding Code

**By Feature:**
- Use [Source Tree Analysis](./source-tree-analysis.md) to locate directories
- Check package `src/index.ts` for exports
- Search in `sdk-api-metadata.json` for function names

**By Type:**
- TypeScript types: Look in `packages/*/src/types/`
- Utilities: Look in `packages/*/src/utils/`
- Components (docs/playground): Look in `apps/*/components/`

### Finding Documentation

**Technical Details:**
- Architecture patterns → [Architecture Documentation](./architecture-sdk.md)
- Directory structure → [Source Tree Analysis](./source-tree-analysis.md)
- Development setup → [Development Guide](./development-guide.md)

**User-Facing Docs:**
- Getting Started → `apps/docs/content/1.getting-started/`
- API Usage → `apps/docs/content/2.api/`
- Examples → `apps/docs/content/3.examples/`
- Guides → `apps/docs/content/4.guides/`

---

## 🌐 External Links

### Official Resources

- **Homepage:** https://hydrasdk.com
- **Repository:** https://github.com/Vtechcom/hydra-sdk
- **NPM Organization:** https://npmjs.com/org/hydra-sdk
- **Documentation Site:** https://hydrasdk.com/docs

### Related Projects

- **Cardano:** https://cardano.org
- **Hydra Head Protocol:** https://hydra.family/head-protocol/
- **Emurgo CSL:** https://github.com/Emurgo/cardano-serialization-lib

---

## 📝 Documentation Maintenance

### When to Update

- **After major features:** Update architecture + source tree
- **API changes:** Regenerate API reference
- **New packages:** Update project overview + source tree
- **Directory restructure:** Update source tree analysis
- **Build process changes:** Update development guide

### How to Regenerate

```bash
# Re-run document-project workflow
*document-project

# Choose option:
# 1 - Re-scan entire project
# 2 - Deep-dive specific area
```

---

## ✅ Documentation Checklist

**Before starting development:**
- [ ] Read Project Overview
- [ ] Understand architecture
- [ ] Set up development environment
- [ ] Run tests to verify setup

**Before submitting PR:**
- [ ] Update relevant package README
- [ ] Update CHANGELOG if using changesets
- [ ] Add tests for new features
- [ ] Update API reference if APIs changed
- [ ] Check documentation builds

**Before releasing:**
- [ ] Verify all docs are up to date
- [ ] Regenerate API reference
- [ ] Update version numbers
- [ ] Review PUBLISH_GUIDE.md

---

## 🎉 Conclusion

This documentation suite provides comprehensive coverage of the Hydra SDK monorepo for:
- ✅ **Human developers** - Understanding, developing, and maintaining the SDK
- ✅ **AI agents** - Code generation, refactoring, and assistance
- ✅ **New contributors** - Onboarding and learning the codebase
- ✅ **Project management** - Planning and tracking development

**All documentation is versioned and maintained alongside the codebase.**

---

**Generated by:** BMad Method - document-project workflow  
**Scan Level:** Deep  
**Date:** 2025-11-18  
**Workflow State:** `./project-scan-report.json`
