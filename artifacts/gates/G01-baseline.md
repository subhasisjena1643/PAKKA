# G01 — Reproducible baseline

**Prompt:** 01 (scaffold, pin, reproducible baseline) · **Owner:** B (Lane B — consumer/UI)
**Depends on:** G00 · **Branch:** `web/scaffold` · **Base commit:** `2f4f672b8c483aa203224b02748efca4e7f37acc`
**Date:** 2026-08-15 · **Status:** PASS (Core)

## Binary gate

> A clean clone can install and build; template provenance is pinned; no secrets are tracked.

All three met. Evidence below.

## Environment

| Tool | Version |
| --- | --- |
| node | 22.14.0 (`.nvmrc`, engines `>=22.14.0 <23`) |
| npm | 11.2.0 |
| forge | 1.3.6 |
| solc | 0.8.24 (pinned in `packages/contracts/foundry.toml`) |

Template provenance (root `README.md`): upstream `monad-developers/next-serwist-privy-smart-wallet`,
pinned commit `01ba917f9dd31a8067b7dd562c7a74fd928d5537`, vendored 2026-08-15 into `apps/web`.

## Commands run and results

| Command | Result |
| --- | --- |
| `npm install` | PASS — 1100 packages; root `package-lock.json` generated |
| `npm run verify:no-secrets` | PASS — 11 tracked files scanned, none flagged |
| `npm run lint` | PASS — warnings only (template `Demo.tsx` `<img>`, `useSmartWallet` deps); no errors |
| `npm run typecheck` | PASS — all 4 workspaces (`web`, `config`, `chain`, `ui`) `tsc --noEmit` clean |
| `npm run test` | PASS — vitest 7/7 (`packages/config` env schema) |
| `npm run contracts:fmt-check` | PASS |
| `npm run contracts:build` | PASS |
| `npm run contracts:test` | PASS — 1/1 scaffold toolchain test |
| `npm run build` | PASS — Next.js production build, all routes prerender |
| `npm run test:e2e` | NOT RUN — Playwright browsers not installed (permitted Core cut; smoke spec present) |

## Changes made this pass

- Removed default `forge init` boilerplate (`Counter.sol`, `Counter.t.sol`, `Counter.s.sol`) — not PAKKA
  code; real contracts arrive in Prompt 03 (Lane A). Added `src/` `script/` `.gitkeep`.
- Added `packages/contracts/test/Scaffold.t.sol` — a trivial `^0.8.24` toolchain test so `contracts:test`
  is a green non-empty run. Asserts nothing about PAKKA behaviour.
- `vitest.config.ts` — pinned an empty PostCSS config so Vite does not walk out of the repo to an unrelated
  `postcss.config.mjs` on the drive root (broke `npm run test` collection).
- Privy app-ID placeholder: Privy validates the app ID is a string of exactly 25 chars at provider init, so a
  short placeholder crashes `next build` prerender. Set the CI/build placeholder and `.env.example` note to a
  25-char value. App IDs are public (`NEXT_PUBLIC_`); the placeholder is clearly fake, not a real credential.

## Risks / unresolved

- `next@14.2.30` carries a flagged security advisory (npm warning, 2025-12-11). Not addressed here; patch bump
  to be tracked before any deploy prompt.
- `evm_version` left to solc default in `foundry.toml` — must be confirmed against official Monad docs before
  deployment (Prompt 06 / plan §3.2).
- e2e not exercised at Core (browsers absent); the app boots under `next build` and the smoke spec exists.
- `verify:no-secrets` scans only git-tracked files; scaffold is not yet committed, so scan coverage grows on commit.

## Scope guard

No PAKKA screens, contracts, or product logic implemented (per Prompt 01 spec). Prompt 02 NOT started.

**Commit SHA:** `4828620` (branch `web/scaffold`).
