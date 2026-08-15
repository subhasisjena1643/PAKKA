# PAKKA — group checkout on Monad

A group checkout that settles only when enough people have committed.

> `PAKKA?` → people join → `GROUP READY` → merchant confirms → `PAKKA!`

This is the **repository root**. Product intent, frozen decisions, and the ordered build prompts live in
[`docs/`](./docs/) — start at [`docs/README.md`](./docs/README.md). Build status lives in
[`artifacts/gates/`](./artifacts/gates/) — the gate reports are the only trustworthy record of what actually works.

> Unaudited hackathon software with a live, peer-voted demo. Use demo credits on testnet; only tiny mainnet
> amounts the team can afford to lose. Testnet and mainnet value never mix.

## Template provenance

The `apps/web` PWA is vendored from the official Monad sponsored-transactions template. The verified
Privy embedded-signer + Kernel smart-account + Pimlico paymaster path (`apps/web/app/hooks/useSmartWallet.tsx`,
`apps/web/app/components/{privy-provider,UseLoginPrivy,Demo}.tsx`) is preserved from upstream.

| | Value |
| --- | --- |
| Upstream | `https://github.com/monad-developers/next-serwist-privy-smart-wallet` |
| Pinned commit | `01ba917f9dd31a8067b7dd562c7a74fd928d5537` |
| Vendored at | 2026-08-15 |

This is a **pinned commit SHA, not a moving branch**. The only intentional change from upstream at scaffold time
is bumping `viem` to `^2.40.0` to meet Monad's documented minimum (plan §3.2); the smart-wallet source is
otherwise unchanged.

## Layout

```
apps/web/            Next.js 14 PWA (attendee/merchant/receipt/wall/ops) — vendored template
packages/
  contracts/         Foundry project (Solidity) — implemented from Prompt 03
  chain/             generated ABI, chain config, event reducer (only web-facing chain layer)
  ui/                design tokens, components, motion
  config/            validated env schema (zod)
scripts/             deploy / verify / seed / smoke / config-emit / verify-no-secrets
deployments/         generated <chainId>.json manifest — single source of addresses
docs/                spec, plan, prompt pack, session preamble
artifacts/gates/     one Gxx-*.md evidence report per completed prompt
```

## Toolchain

- Node `22.14.0` (pinned in `.nvmrc`), npm workspaces, **one** root `package-lock.json`.
- Foundry (forge/cast/anvil) — record the Monad-recommended build before contract work (see `G00`).
- `viem >= 2.40.0` (Monad minimum, plan §3.2).

## Commands

```bash
npm ci                     # clean install from the root lockfile
npm run lint
npm run typecheck
npm run test               # unit (vitest)
npm run build              # production build of apps/web
npm run contracts:build    # forge build (packages/contracts)
npm run contracts:test
npm run test:e2e           # Playwright
npm run verify:no-secrets  # fails on committed .env files or private-key-shaped values
npm run gate               # aggregates the whole release gate (plan §8.1)
```

## Environment

Copy [`.env.example`](./.env.example) and fill values (plan §6.2). Never commit real values — no server secret or
private key may carry a `NEXT_PUBLIC_` prefix. Four chain-derived values are generated from the deployment
manifest by `npm run config:emit`, never hand-typed (plan §6.2.1).
