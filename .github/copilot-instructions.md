---
applyTo: '**'
---

# Hydra SDK Docs – Copilot Instructions

## Rules

- Always keep **English** (`docs/content/**/**.md`), **Vietnamese** (`docs/content/vi/**/**.md`), **Japanese** (`docs/content/ja/**/**.md`) docs in sync.
- Translate **guides/tutorials only**; keep **code, variables, keywords, and glossary terms** (`migration`, `wasm`, `utilities`, `Hydra Head`, `UTxO`, `Plutus`, `CBOR`...) in English.
- Glossary terms are stored in `i18n/locales/en.json`, `i18n/locales/vi.json`, `18n/locales/ja.json`.
  - Before adding new terms, check if they exist.
  - If missing → add to **both files** with the same `term` and localized `desc`.
- Always check available api function in `sdk-ai-agent/sdk-api-metadata.json`.
- Use glossary terms consistently across all docs.
- Don't caplitalize all words of title in Vietnamese

## Checklist for Edits

- [ ] English + Vietnamese versions exist
- [ ] Glossary terms preserved
- [ ] New terms added to `en.json` + `vi.json` + `ja.json`
- [ ] Content updated in **both languages**
- [ ] Technical tone preserved, friendly explanation in Vietnamese
