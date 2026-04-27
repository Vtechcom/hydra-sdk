# 🚀 CI/CD Pipeline - Nodejs Playground Tests

This document describes the Continuous Integration workflow used for the **Nodejs Playground** service.  
The pipeline is executed on every push and pull request targeting:

- `master`
- `develop`

---

## 📌 Workflow Overview

The CI pipeline performs:

1. **Source checkout**
2. **Node.js & pnpm setup**
3. **Dependency installation with caching**
4. **Environment variable provisioning**
5. **Automated test execution**
6. **Test reporting & PR comment creation**
7. **Coverage collection and summary output**

---

## 🏗 Trigger Rules

| Event Type | Branch |
|------------|--------|
| Push       | master, develop |
| Pull Request | master, develop |

---

## ⚙️ Environment Setup

- **Node version:** `22.16.0`
- **Package manager:** `pnpm v9`
- **Cache:** pnpm store is cached to speed installation
- `.env` for tests is generated automatically using GitHub Secrets

---

## 🧪 Test Execution

Tests run via:

```bash
pnpm run test:ci