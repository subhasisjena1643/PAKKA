# G00 — Repository audit and orientation

- Prompt: 00 (one-time, global)
- Owner: A (produces this artifact) · countersign: B ☑ (2026-08-15), C ☐ (pending)
- Branch / commit SHA: `main` @ `2f4f672b8c483aa203224b02748efca4e7f37acc`
- Date (UTC): 2026-08-15
- Depends on: — (none)
- Status: PASS — safe to continue to Prompt 01 (scaffold) and Prompt 02 (contract spec); downstream blockers named below

## Commands run

| Command | Result | Key output |
| --- | --- | --- |
| `node --version` | ok | `v22.14.0` |
| `npm --version` | ok | `11.2.0` |
| `git --version` | ok | `2.48.1.windows.1` |
| `forge --version` | ok | `1.3.6-v1.3.6` (stable, build profile maxperf) |
| `cast --version` | ok | `1.3.6-v1.3.6` |
| `anvil --version` | ok | `1.3.6-v1.3.6` |
| `slither --version` | **not found** | not installed on this machine |
| `git status --porcelain` | ok | empty — worktree clean |
| `git branch --show-current` | ok | `main` |
| `git ls-files` | ok | 11 tracked files (see repo map) |

Environment: Windows 11, PowerShell. (The `slither` probe under Bash returned exit 127; Foundry tools resolve fine.)

## Repository map

Docs-and-evidence only. **No application code exists yet** — `apps/`, `packages/`, `scripts/`,
`deployments/` do not exist; Prompt 01 creates the first of them.

```
CLAUDE.md                       standing agent rules
LICENSE
artifacts/gates/README.md       gate format + live index (only file in gates/)
docs/
  README.md                     document index / reading order
  IMPLEMENTATION_PLAN.md        frozen decisions (authoritative)
  PRODUCT_SPEC.md               product intent (historical)
  PAKKA_BLITZ_PROMPT_PACK.md    prompts 00–18, gates, deps
  SESSION_PREAMBLE.md           one-screen per-session paste
  LIVE_LINKS.md                 working file (empty template)
  MAINNET_APPROVAL.md           working file (empty template)
  archive/2026-08-14-combined-plan-and-prompt-pack.md   superseded, do not cite
```

Absent (expected at this stage, each created by a later prompt): `package.json`, `package-lock.json`,
`.env.example`, `foundry.toml`, `packages/contracts/foundry.toml`, `.gitignore`, node-version pin
(`.nvmrc`/`.node-version`/`.tool-versions`), `AGENTS.md`. No root `README.md` (only `docs/README.md`).

Worktree is **clean** (nothing dirty, nothing untracked).

## Detected tool versions

| Tool | Version | Note |
| --- | --- | --- |
| node | v22.14.0 | fine; Prompt 01 will pin the exact version |
| npm | 11.2.0 | template ships with npm; do not switch package managers |
| git | 2.48.1 (windows) | |
| forge / cast / anvil | 1.3.6 (stable) | see PENDING below re: Monad-recommended build |
| slither | **MISSING** | required by Prompt 05 |

**PENDING — Monad-recommended Foundry build not confirmed.** Installed Foundry is stable `1.3.6`. The pack
requires "the Monad-recommended Foundry build per current official docs," verified on the day. This audit does
**not** assert 1.3.6 is that build. Whoever runs Prompt 03/04/06 must confirm against official Monad docs and
record the verified build; do not trust this snapshot. — owner A

## Verified gate status

Trusting `artifacts/gates/` contents, not assumptions. Only `README.md` exists there; **no `Gxx` report exists**,
so every gate below is *not started* except G00, which this file opens.

| Gate | Prompt | Status (verified) |
| --- | --- | --- |
| G00 | 00 audit | **PASS (this file)** — countersign by B/C pending |
| G01 | 01 scaffold | not started |
| G02 | 02 threat model + interface freeze | not started |
| G03–G06 | 03 contracts → 06 deploy | not started |
| G07a/b | 07 reducer / manifest | not started |
| G08–G14 | 08 sponsored → 14 e2e | not started |
| G15–G18 | 15 RC → 18 live | not started |

Green gates: **none** (G00 opens now). Claimed-but-unverifiable: **none**. Not started: **all others**.

## Missing prerequisites (plan §7.1) and the prompt each blocks

None of §7.1 is verifiable from the worktree — these are human/external/physical items. Listed as **UNVERIFIED**
(treat as not-done until a human confirms) with the prompt each blocks:

| Prerequisite (§7.1) | Blocks | 
| --- | --- |
| Monad-recommended Foundry build installed **and recorded** | 03, 04, 06 (contract build/deploy correctness) |
| `slither` installed | **05** (red-team; `slither .` and `npm run gate`) |
| Privy app configured (email/Google, embedded wallet, origins) | 08, 10, 11 (auth + sponsored join) |
| Pimlico account + restricted sponsor policy/budget | 08 (sponsored batches) |
| Two independent Monad RPC providers tested | 06 (deploy), 07b (failover) |
| Testnet deployer funded from faucet | 06 (deploy + seed + smoke) |
| Verification key (Monadscan/Etherscan) or rehearsed Sourcify path | 06 (contract verification) |
| Vercel project + domains | 15, 18 (preview/prod, live links) |
| Three test phones (iOS/Safari + Android/Chrome) | 14 (e2e/device), 18 |
| Merchant + 3–5 mainnet proof accounts, labelled | 18 (mainnet proof) |
| Mainnet accounts pre-warmed, funded tiny approved amount only | 18 (mainnet proof) |
| ESP32 / servo / box / manual release tested | 12, 17 (Purple Box) — digital-box variant otherwise |
| `VERIFIED REPLAY` recording captured | 17 (incident fallback) |
| Git repo access for all three; branch protection on default | workflow hygiene (force-push protection **unverified** from worktree) |

## Environment variables

No `.env.example` and no env schema exist yet (both arrive with Prompt 01 / `packages/config`). Therefore **all**
runtime env vars are currently absent — this is expected, not a defect. Neither of the immediately-runnable next
prompts (01 scaffold, 02 threat model) requires any env var, so this does not block continuing. Env-var gaps
first bite at Prompt 06 (RPC/deployer/verifier) and Prompt 08 (Privy/Pimlico); see plan §6.2 for the full table.

## Plan / pack / code disagreements

- **Code vs docs:** none — no product code exists to conflict.
- **Plan vs pack:** none observed in the sections read (§0 authority, §7.1 prerequisites, pack §4 dependency
  graph, gates README). The pack's gate index and the gates `README.md` index agree.
- **Doc-map nit (non-blocking):** `docs/README.md` and CLAUDE.md reference a root `README.md`-style entry, but
  only `docs/README.md` exists. Not a contradiction with the plan; noted for whoever runs Prompt 01.

## Answers to the required questions

- **Which gates are green / claimed-unverifiable / not started?** Green: none (G00 opens with this file).
  Claimed-but-unverifiable: none. Not started: G01–G18.
- **Next prompt for this lane, and are its `Depends on` gates green?** This is a global run. Overall next is
  **Prompt 01 (scaffold, owner B, Depends on: G00)**; lane A's next is **Prompt 02 (Depends on: G00)**. Both
  depend only on **G00, which this artifact satisfies** — so yes, their dependency is now green.
- **Safe to continue, or human blocker first?** **Safe to continue to Prompt 01 / Prompt 02.** No blocker gates
  those two. Humans must clear, before the specific prompt each blocks: `slither` (P05); the recorded
  Monad-recommended Foundry build, funded deployer, RPC providers, verifier (P06); Privy + Pimlico (P08); and all
  mainnet §7.1 items (P18). None of these block starting the build.

## Hand-off

A verified gate-status snapshot (all not-started except G00) and a prerequisite gap list keyed to the prompt each
item blocks. Downstream prompts can trust: worktree clean at `2f4f672`; toolchain node 22.14 / npm 11.2 / Foundry
1.3.6 present; `slither` missing; Foundry-build-vs-Monad-recommended unconfirmed.

## Risks / TODO / accepted findings

- **TODO (A):** confirm and record the Monad-recommended Foundry build before Prompt 03/06. — owner A
- **TODO (A):** install `slither` before Prompt 05. — owner A
- **TODO (human):** countersign this audit — B ☐, C ☐. — owners B, C
- **TODO (human):** verify default-branch force-push protection (not observable from worktree). — owner A
- **Accepted (non-blocking):** all §7.1 human/hardware prerequisites are UNVERIFIED from the repo; they are
  tracked above against the prompt each blocks and do not gate Prompt 01/02. Expiry: revisit at each blocked
  prompt. — owners per row.

## Do not begin the next prompt

Per Prompt 00 rules, this session stops here. Prompt 01 is a separate pass (owner B).
