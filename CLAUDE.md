# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current repository state

**Specification and Execution document are committed. Application and contract implementationbegins at Prompt 1**. `docs/` holds the full
design; `apps/`, `packages/`, and `scripts/` do not exist until Prompt 01 creates them.

| Document | Role |
| --- | --- |
| `docs/README.md` | Entry point — reading order, doc map, the nine rules |
| `docs/PRODUCT_SPEC.md` | Product intent and scope (10 Aug, historical, do not edit) |
| `docs/IMPLEMENTATION_PLAN.md` | **Frozen technical decisions** — invariants, bounds, budgets. Section numbers are load-bearing |
| `docs/PAKKA_BLITZ_PROMPT_PACK.md` | 19 ordered prompts (00–18), each with owner, branch, dependencies, and a binary gate |
| `docs/SESSION_PREAMBLE.md` | The one screen pasted into every agent session — invariants, authority, evidence rules, stop conditions |
| `docs/LIVE_LINKS.md`, `docs/MAINNET_APPROVAL.md` | Working files — fill in only from observed output |
| `artifacts/gates/` | Gate evidence, one file per prompt — the only record of what is actually green |
| `docs/archive/` | Pre-split combined document. Superseded; do not cite |

**Authority order** when sources conflict: chain state → `IMPLEMENTATION_PLAN.md` → `PRODUCT_SPEC.md` →
`PAKKA_BLITZ_PROMPT_PACK.md` → code comments. The plan supersedes the spec deliberately (`liabilityByToken`,
`Ownable2Step`, the exit-preserving pause, `AwaitingQuote → Expired`); the full diff is in plan §0.3. A prompt
may never contradict the plan — if one appears to, stop and raise it.

Do not read the whole plan before every task. Read the sections your prompt's `Spec refs` line cites.

## Product in one paragraph

PAKKA is a group checkout on Monad. An organizer creates a fixed-price plan for one named merchant. The merchant accepts an immutable quote **before** funding opens. Participants each commit one equal contribution into escrow. Reaching the participant threshold moves the plan to `Ready` and **transfers nothing**. Only the named merchant, and only inside the response window, can freshly confirm availability — that call atomically settles the whole pool. Funding-deadline expiry, merchant rejection, or response-window expiry each enable exact, one-time, pull-based refunds.

## Non-negotiable invariants

Violating any of these is a blocking defect, not a style question:

1. **Quote before funding.** `join` reverts until the named merchant has called `acceptQuote`.
2. **Threshold ≠ payment.** The threshold-reaching join sets `Ready` and `readyAt` only. The merchant balance must not change. Never render `PAKKA!` on `Ready` — that state is `GROUP READY — awaiting merchant`.
3. **Merchant-only settlement**, only while `Ready`, only when `block.timestamp < readyAt + merchantResponseWindow`.
4. **Pull refunds only.** Expiry/rejection changes state once; there is no participant array, no refund loop, no unbounded iteration anywhere.
5. **The chain is the only authority** for state, counts, balances, and settlement. Supabase/realtime may fan out invalidation hints and public tx hashes; it may never decide a number.
6. **Pending never counts.** Optimistic UI animates amber. A node goes solid violet/gold only after a successful receipt *plus* the configured `FINALITY_CONFIRMATIONS`.
7. **No admin escape hatch.** No upgradeability, no owner withdrawal or rescue of allowlisted tokens while `liabilityByToken[token] > 0`, no fees.
8. **Exit-preserving pause.** Paused blocks `createPlan`, `acceptQuote`, `join`, and settlement; it must still permit `leave`, `expire`, `rejectReadyPlan`, and `claimRefund`.
9. **Testnet and mainnet value never mix.** Never sum the two. Never call `DemoINR` credits money/INR/stablecoin/payment.

### Deadline semantics (one rule, used identically in Solidity, TS, tests, and copy)

- `acceptQuote` / `join` / `leave`: allowed only when `block.timestamp < fundingDeadline`.
- Funding expiry: allowed when `block.timestamp >= fundingDeadline`.
- `confirmReadyAndSettle`: allowed only when `block.timestamp < decisionDeadline`.
- Decision expiry: allowed when `block.timestamp >= decisionDeadline`.
- `rejectReadyPlan`: any time while `Ready`.
- UI timers are informative; the contract timestamp is authoritative.

### Accounting rules

- `join` verifies the actual contract balance delta equals the contribution — fee-on-transfer and rebasing tokens must revert or never be allowlisted.
- Increment `plan.totalLocked` **and** `liabilityByToken[token]` together, exactly once.
- Reduce plan and global liability **before** any external token transfer (checks-effects-interactions under `nonReentrant`).
- `participantCount` is the live active count while `Open`, then a **frozen terminal snapshot** after `Ready`. Refund progress is expressed via `totalLocked`, `liabilityByToken`, membership flags, and `RefundClaimed` events — never by decrementing the frozen count.
- `totalLocked == participantCount * contribution` while `Open` or `Ready`.
- A participant who `leave`s cannot later claim a refund unless they rejoined and locked a fresh contribution.

## Architecture

```
Attendee/merchant PWA → Privy embedded signer + Kernel smart account
                      → Pimlico bundler + restricted paymaster
                      → PakkaEscrow on Monad
                      → confirmed event reducer → wall, receipts, ops, Purple Box
```

Planned layout (npm workspaces, one root `package-lock.json` — the official Monad template ships with npm; do not switch package managers):

```
apps/web/                 attendee, merchant, receipt, wall, ops routes + e2e
packages/contracts/       Foundry project (src, script, test)
packages/chain/           generated ABI, chain config, event reducer  ← only web-facing chain layer
packages/ui/              design tokens, components, motion
packages/config/          validated env schema
scripts/                  deploy-testnet, deploy-mainnet, verify-contracts,
                          seed-crowd-plan, create-mainnet-plan, smoke-test, verify-live-links
docs/                     README, PRODUCT_SPEC, IMPLEMENTATION_PLAN, PAKKA_BLITZ_PROMPT_PACK,
                          LIVE_LINKS, MAINNET_APPROVAL          ← exist now
                          THREAT_MODEL (P02), DEMO_RUNBOOK (P17), INCIDENT_FALLBACKS (P17)
artifacts/gates/          one Gxx-*.md evidence report per completed prompt
deployments/<chainId>.json  generated manifest — the single source of addresses
```

Key structural rules:

- **The ABI is generated from Foundry artifacts** into `packages/chain`. Never hand-maintain a second copy.
- **Addresses and explorer URL builders come from `deployments/<chainId>.json`**, generated at deploy time and never manually copied between components.
- `packages/chain` is the only integration layer the web app touches. It owns typed reads/writes, the pure event reducer, dedup by `(chainId, txHash, logIndex)`, log ordering by `(blockNumber, transactionIndex, logIndex)`, replay from the deployment block, and primary/backup RPC failover with chain-ID revalidation.
- Reducer output is reconciled against `getPlan`. Disagreement is a **visible health error plus bounded full replay** — never a silent best guess.
- Startup validates chain ID, contract bytecode, and token address. Mismatch fails closed.
- The contract stores only `metadataHash`. One canonical JSON serializer (shared by scripts and web) is hashed with `keccak256`; the merchant screen verifies fetched bytes against the on-chain hash before quote acceptance. The hashed document contains only pre-`createPlan` values — never inject `planId` afterward.

## Contract surface

`PakkaEscrow.sol` — Solidity `^0.8.24`, OpenZeppelin 5.x, `SafeERC20`, `ReentrancyGuard`, `Pausable`, `Ownable2Step`, custom errors, non-upgradeable.

```
createPlan  acceptQuote  join  leave  expire  confirmReadyAndSettle
rejectReadyPlan  claimRefund  cancelEmptyPlan  getPlan  setTokenAllowed  pause  unpause
```

States: `None, AwaitingQuote, Open, Ready, Settled, Expired, Rejected, Cancelled`.

Frozen constants (plan §4.5 — exact values, asserted by Prompt 04; changing one needs a review note):

```solidity
MIN_PARTICIPANTS = 2;  MAX_PARTICIPANTS = 100;  MAX_CONTRIBUTION = 1_000_000_000; // 1,000 units @ 6dp
MIN_FUNDING_HORIZON = 60;  MAX_FUNDING_HORIZON = 7 days;
MIN_RESPONSE_WINDOW = 60;  MAX_RESPONSE_WINDOW = 24 hours;
```

Also frozen: `nextPlanId` starts at `1` (plan ID `0` is permanently invalid); `metadataHash` must be non-zero;
constructor takes an explicit `initialOwner`; deploys unpaused with an empty allowlist. Bounds are inclusive at
both ends — a deadline exactly `now + MIN_FUNDING_HORIZON` is valid.

`MAX_CONTRIBUTION` is a **per-plan input bound, not a global exposure cap** — plans are unbounded, so it caps
nothing overall, and at 6 decimals it permits 1,000 USDC per participant. Total mainnet exposure is controlled
operationally: the mainnet script hard-codes 3 participants × 1 USDC = 3 USDC maximum (plan §4.5).

Full struct/storage/event/bounds definitions live in plan §4.2–§4.5 — treat them as frozen once Prompt 02 completes. The event payloads in plan §4.4 are a hard contract with the reducer: lane C builds Prompt 07 against that freeze in parallel with lane A writing Solidity, so changing a payload later requires notifying that lane.

`DemoINR.sol` — six-decimal, open-mint, **testnet only**. Must carry permanent `NO CASH VALUE — TESTNET ONLY` source comments and metadata, and must never be reachable from the mainnet deployment script.

Sponsored join batches:

```ts
// testnet (chain 10143)
[DemoINR.mint(smartAccount, contribution), DemoINR.approve(escrow, contribution), escrow.join(planId)]
// mainnet (chain 143) — no mint path may compile into mainnet mode
[/* approve only if allowance insufficient */ USDC.approve(escrow, contribution), escrow.join(planId)]
```

## Commands

No `package.json` exists yet. When scaffolding, provide exactly these root scripts (plan §8.1) so `npm run gate` covers the whole release gate:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run contracts:fmt-check
npm run contracts:build
npm run contracts:test
npm run contracts:coverage
npm run build
npm run test:e2e
npm run verify:no-secrets    # fails on committed .env files or private-key-shaped values
npm run gate                 # aggregator for all of the above
```

Contract work runs in `packages/contracts`:

```bash
forge fmt --check
forge build --sizes
forge test -vvv
forge test --match-test <TestName>     # single test
forge test --match-contract <Suite>    # single suite
forge test --gas-report
forge coverage
slither .
```

Coverage target: **100% branch coverage on join, leave, readiness, settlement, expiry, rejection, and refund paths.** Overall percentage matters less than covering every monetary transition. Document intentionally-unreachable lines; do not pad with meaningless tests.

## Workflow: prompts and gates

Work is organized as 19 sequential prompts with binary exit gates. Do not skip ahead, and do not start the next prompt in the same pass.

- Paste **`docs/SESSION_PREAMBLE.md`** at the start of every session. **Prompt 00 runs once globally, owned by A and countersigned by B and C**, not every
  session — it is a repository audit that produces `G00-orientation.md`.
- **A gate passes at Core** (plan §8.6). Stretch items are recorded as `NOT RUN — stretch`; named cut variants
  (digital box, direct polling, two viewports, mainnet `SKIPPED SAFELY`) also pass. Say which variant you used.
- Every prompt ends by writing `artifacts/gates/Gxx-*.md` containing commands run, pass/fail, changed files, risks, and the commit SHA — **never secrets, never invented command output, hashes, addresses, or links.**
- A failing gate stops that lane. Fix, rerun the gate, then continue.
- Make the smallest coherent change for the current prompt. Preserve unrelated human work.

Lane ownership and file boundaries (three concurrent agents; do not edit across lanes):

| Lane | Branch prefix | Owns |
| --- | --- | --- |
| A — chain/reliability | `chain/` | `packages/contracts`, deploy scripts, manifests, verification, RPC failover |
| B — consumer/UI | `web/` | auth UX, attendee, merchant, receipt, app shell |
| C — live/demo | `live/` | reducer, wall, ops health, box endpoint/firmware, demo docs |

Changes to `packages/chain` need review from A plus the consumer owner using the change.

## Stop and ask a human before

- broadcasting any mainnet transaction;
- changing a deployed contract address in production config;
- selecting or allowlisting a mainnet token;
- raising a paymaster budget or loosening a sponsor policy;
- rotating or exposing credentials;
- suppressing a failing monetary test, static-analysis finding, type error, or chain mismatch;
- changing a contract invariant or the post-threshold merchant confirmation rule;
- deleting or rewriting user work unrelated to the current prompt.

## Chain and environment

Verify against official Monad docs on the day — do not trust snapshots in these documents. As recorded 14 Aug 2026: testnet chain ID `10143`, mainnet `143`, `viem >= 2.40.0`, 300 ms blocks with finality after two blocks. Because receipts can appear before finality, presentation is two-stage: **receipt seen → amber/pending**, **finalized threshold reached → solid violet/gold**.

Monad's lifecycle is Proposed `N` → Voted `N+1` → **Finalized `N+2`**. The primary confirmation rule is the
`finalized` block tag, not arithmetic (plan §3.3.1):

```ts
const finalized = await client.getBlock({ blockTag: 'finalized' })
const confirmed = receipt.status === 'success' && receipt.blockNumber <= finalized.number
```

Inclusive-depth fallback only when the tag is unavailable: `FINALITY_CONFIRMATIONS = 3` for UI (3, not 2 —
2 would confirm at the Voted stage), `CONSERVATIVE_FINALITY_CONFIRMATIONS = 6` for the Purple Box and any
mainnet proof, which is finality plus a buffer and is **not** Monad's Verified stage. Both live in validated
chain config, never as scattered literals.

Mainnet USDC must be resolved from Circle's reference *and* Monad's token list immediately before deployment, then verified on chain (bytecode, `name`, `symbol`, `decimals`, explorer label) and written once to the deployment manifest with human sign-off in `docs/MAINNET_APPROVAL.md`. Any mismatch means skip the mainnet proof. Never paste an address from a document into deploy code.

Environment rules: no private key, server secret, or unrestricted provider key may use a `NEXT_PUBLIC_` prefix. Commit `.env.example` with placeholders only. Validate every variable against a schema at process startup. Restrict Pimlico credentials by origin, chain, target contract, selector, gas, per-user rate, and total budget. Full variable table in plan §6.2.

## UI and copy constraints

- **Forbidden on consumer surfaces:** wallet, gas, approve, ERC-20, user operation, contract call, paymaster, testnet. Technical detail hides behind `Verified on Monad`. The one exception is the explicit `DEMO CREDITS — NO CASH VALUE` label.
- Visual language: near-black plum canvas, electric violet = confirmed, amber = pending, restrained gold = settled, grey = released/refunded, red = true reverts/errors only. No generic crypto gradients, coin icons, glassmorphism, or price widgets.
- The `CommitmentReactor` SVG supports 2–100 segments and receives **typed confirmed state plus a separate pending overlay** — it must not infer state from a numeric percentage, and must never label `Ready` as settled.
- Never loop celebratory animation; React re-renders must not replay a confirmed celebration. One animation timeline owns each lifecycle transition.
- Animate only `transform`, `opacity`, SVG stroke, and non-layout custom properties. Honor `prefers-reduced-motion`. Pause ambient work when the tab is hidden or the element is offscreen.
- Never display email addresses or raw wallet addresses on the wall — use generated aliases and identicons.
- Targets: LCP < 2.5 s on the event phone, returning-participant intent < 7 s, confirmed wall transition < 2 s after finality, Lighthouse Performance ≥ 85 / Accessibility ≥ 95 / Best Practices ≥ 90. Fix regressions rather than lowering budgets.

## Purple Box endpoint

`/api/box/[planId]` returns a signed response with short expiry and a replay-resistant nonce/counter. The server independently validates chain, deployment, plan, the confirmed settlement receipt/log, and `getPlan().state == Settled` before `unlock=true`. **A browser-supplied `settled` boolean can never unlock it.** Provide a hidden manual mechanical release and a separate digital fallback — never a fake on-chain trigger.

## Truthfulness

This is unaudited hackathon software with a live, peer-voted demo. Every displayed metric must derive from confirmed chain state. Never fabricate transaction links, counts, testimonials, or gate evidence. `VERIFIED REPLAY` fallbacks must be visibly watermarked and built from a real prior confirmed transaction set. Pre-event work is described plainly: "The infrastructure was prepared; this network of commitments was created live in this room today."
