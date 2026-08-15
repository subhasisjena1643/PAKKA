# PAKKA threat model and contract interface freeze

**Prompt 02 · Gate G02 · frozen.** Derived from `IMPLEMENTATION_PLAN.md` §2.4–§2.6 and §4.1–§4.7. This is an
executable design: every monetary requirement maps to a function, an event, and a stable test ID (§7). Test IDs
are cited by Prompts 04 and 05 and must not be renumbered. Where this document and the plan appear to conflict,
the plan wins and the conflict is raised in §9 — nothing is silently chosen.

The frozen Solidity surface lives in `packages/contracts/src/interfaces/IPakkaEscrow.sol` and
`packages/contracts/src/PakkaConstants.sol`. The frozen cross-lane TypeScript lives in
`packages/chain/src/lifecycle.ts` (UI lifecycle type) and `packages/chain/src/metadata.ts` (canonical serializer).

## 1. Actors, trust boundaries, assets

| Actor | Trust | Capability |
| --- | --- | --- |
| Organizer / creator | untrusted | `createPlan`, `cancelEmptyPlan` (own empty plan) |
| Named merchant | untrusted, but sole settlement authority | `acceptQuote`, `confirmReadyAndSettle`, `rejectReadyPlan` |
| Participant | untrusted | `join`, `leave`, `claimRefund` |
| Anyone | untrusted | `expire`, `getPlan` |
| Owner (deployer key) | semi-trusted, deliberately weak | `setTokenAllowed`, `pause`, `unpause`, `Ownable2Step` transfer |
| Token contract | untrusted | ERC-20 the escrow holds; only allowlisted tokens are reachable |

**Trust boundary.** The chain (`PakkaEscrow`) is the only authority for state, counts, balances, settlement, and
refunds (invariant #5). Supabase/realtime and the client are outside the boundary: they may fan out tx hashes and
"refresh" hints and may never decide a number. The Purple Box endpoint re-derives settlement from chain state; a
browser-supplied `settled` boolean can never unlock it.

**Protected assets.** (a) Escrowed contributions — released only by settlement (to merchant) or refund (to
participant). (b) Accounting integrity — `totalLocked` and `liabilityByToken` must stay exact. (c) The lifecycle
itself — no state skip, no double settlement, no double refund.

**Authority boundaries.** Owner has **no** withdrawal, rescue, sweep, migrate, or upgrade path (invariant #7);
there is no such function in the surface (§4.3). Owner cannot move a plan's state or touch allowlisted-token
balances while `liabilityByToken[token] > 0`. Pause is exit-preserving (§5).

**Non-goals (explicit).** No partial fills, no variable contributions, no secondary transfers of membership, no
fee mechanism, no price oracle, no cross-chain messaging, no fiat on/off-ramp, no dispute arbitration beyond
merchant accept/reject/expire.

## 2. State machine and caller permissions

States: `None, AwaitingQuote, Open, Ready, Settled, Expired, Rejected, Cancelled`. `Settled/Cancelled/Expired/
Rejected` are terminal; `Expired` and `Rejected` keep accepting `claimRefund` without leaving the state. No
terminal state is reversible by anyone, including the owner.

```
[*] --createPlan--> AwaitingQuote
AwaitingQuote --acceptQuote(merchant)--> Open
AwaitingQuote --expire(>=fundingDeadline)--> Expired(Funding)
AwaitingQuote --cancelEmptyPlan(creator)--> Cancelled
Open --join/leave--> Open
Open --threshold join--> Ready            (sets readyAt; NO transfer)
Open --expire(>=fundingDeadline)--> Expired(Funding)
Open --cancelEmptyPlan(creator, 0 members)--> Cancelled
Ready --confirmReadyAndSettle(merchant, <decisionDeadline)--> Settled
Ready --rejectReadyPlan(merchant, anytime)--> Rejected
Ready --expire(>=decisionDeadline)--> Expired(MerchantDecision)
Expired --claimRefund--> Expired
Rejected --claimRefund--> Rejected
```

| Function | Caller | Required state | Money effect |
| --- | --- | --- | --- |
| `createPlan` | anyone | n/a | none |
| `acceptQuote` | named merchant | AwaitingQuote | none |
| `join` | participant | Open | exact contribution in |
| `leave` | active participant | Open | exact contribution out |
| `confirmReadyAndSettle` | named merchant | Ready | whole pool to merchant |
| `rejectReadyPlan` | named merchant | Ready | none |
| `expire` | anyone | timed state elapsed | none |
| `claimRefund` | active participant | Expired or Rejected | one exact contribution out |
| `cancelEmptyPlan` | creator | AwaitingQuote/Open, 0 members | none |
| `setTokenAllowed` / `pause` / `unpause` | owner | n/a | none |

### Deadline semantics (one rule everywhere — plan §2.5)

- `acceptQuote` / `join` / `leave`: only when `block.timestamp < fundingDeadline`.
- Funding `expire`: only when `block.timestamp >= fundingDeadline`.
- `confirmReadyAndSettle`: only when `block.timestamp < decisionDeadline` (`decisionDeadline = readyAt + merchantResponseWindow`).
- Decision `expire`: only when `block.timestamp >= decisionDeadline`.
- `rejectReadyPlan`: any time while `Ready`.
- Asymmetric boundary: `<` for the permissive action, `>=` for expiry. Every boundary test asserts both sides of
  the same instant.

## 3. Invariants (asserted by Prompts 04/05)

| # | Invariant | Test ID |
| --- | --- | --- |
| I1 | `join` reverts until the named merchant has `acceptQuote`d (quote before funding) | T-JOIN-BEFORE-QUOTE |
| I2 | Threshold join sets `Ready`/`readyAt` only; merchant balance unchanged | T-READY-NO-TRANSFER |
| I3 | Settlement is merchant-only, Ready-only, and only while `block.timestamp < decisionDeadline` | T-SETTLE-AUTH, T-SETTLE-WINDOW |
| I4 | Refunds are pull-only; one exact contribution; no loop, no participant array | T-REFUND-PULL, T-NO-LOOP |
| I5 | `plan.totalLocked` and `liabilityByToken[token]` move together, exactly once, per join/leave/refund/settle | T-LIABILITY-PAIR |
| I6 | `totalLocked == participantCount * contribution` while Open or Ready | T-LOCKED-EQ-COUNT |
| I7 | `participantCount` is live while Open, then a frozen snapshot after Ready (never decremented on refund) | T-COUNT-FROZEN |
| I8 | Each participant settles/refunds at most once; a leaver cannot refund without rejoining | T-REFUND-ONCE, T-LEAVE-NO-REFUND |
| I9 | After full refunds or a settlement, plan liability is zero | T-ZERO-LIABILITY |
| I10 | No owner path withdraws/rescues allowlisted tokens while `liabilityByToken[token] > 0` | T-NO-RESCUE |
| I11 | Effects (liability reduction) precede any external transfer under `nonReentrant` (CEI) | T-CEI-ORDER |

## 4. Threats, mitigations, test IDs

| ID | Threat | Mitigation | Test ID |
| --- | --- | --- | --- |
| TH-1 | Reentrancy via malicious token in join/leave/refund/settle | `nonReentrant` + checks-effects-interactions; liability reduced before transfer | T-REENTRANCY |
| TH-2 | Fee-on-transfer / rebasing token hides true delta | verify `balanceOf` delta == contribution on join, else `BalanceDeltaMismatch`; such tokens never allowlisted | T-FEE-ON-TRANSFER |
| TH-3 | Malicious/returns-false ERC-20 | `SafeERC20` for transfer/transferFrom | T-SAFE-ERC20 |
| TH-4 | Duplicate join by same account | `hasJoined[planId][account]` → `AlreadyJoined` | T-DUP-JOIN |
| TH-5 | Stale/replaced quote — funding before merchant accepts | state gate: `join` requires `Open`, only reachable via `acceptQuote` | T-JOIN-BEFORE-QUOTE |
| TH-6 | Deadline race (act at exact boundary) | strict `<` / `>=` split; both-sides boundary tests | T-BOUNDARY-FUNDING, T-BOUNDARY-DECISION |
| TH-7 | Pause used as a hostage switch on refunds | exit-preserving pause: `leave/expire/rejectReadyPlan/claimRefund` stay open | T-PAUSE-EXITS |
| TH-8 | Owner abuse (rescue/withdraw/upgrade) | no such function exists; `liabilityByToken` guard; non-upgradeable | T-NO-RESCUE, T-NO-UPGRADE |
| TH-9 | Wrong token / wrong chain | allowlist gate on `createPlan`; startup chain/bytecode/token validation (packages/chain) | T-TOKEN-ALLOWLIST |
| TH-10 | Overflow / unsafe cast | `^0.8.24` checked math; `contribution*minParticipants <= uint128.max` guard; typed struct fields | T-AGGREGATE-OVERFLOW |
| TH-11 | Event/state inconsistency (reducer disagrees with getPlan) | events in §4.4 are the sole financial history; reducer reconciled vs `getPlan` | T-EVENT-COMPLETE |
| TH-12 | Griefing: settle-then-refund, or double settle | single state transition to terminal; `refundClaimed` flag; Ready→Settled once | T-DOUBLE-SETTLE, T-REFUND-ONCE |
| TH-13 | Denial of refund via unbounded loop | no participant array, no loop; pull per-caller | T-NO-LOOP |
| TH-14 | Smart-account batch partial execution (mint/approve/join) | contract treats each call atomically; join re-checks state and delta; UI reads `hasJoined` before retry | T-BATCH-PARTIAL |
| TH-15 | cancelEmptyPlan on a non-empty plan | `participantCount == 0` guard → `PlanNotEmpty` | T-CANCEL-NONEMPTY |
| TH-16 | Metadata swap (merchant shown different terms than hashed) | mandatory non-zero `metadataHash`; merchant screen verifies fetched bytes vs on-chain hash (canonical serializer) | T-METADATA-VECTOR |

## 5. Pause policy (exit-preserving, plan §4.7)

| Blocked while paused | Still available while paused |
| --- | --- |
| `createPlan`, `acceptQuote`, `join`, `confirmReadyAndSettle` | `leave`, `expire`, `rejectReadyPlan`, `claimRefund` |

Pause stops new risk; it must never trap escrowed funds. Test T-PAUSE-EXITS asserts each exit path succeeds while
paused; T-PAUSE-BLOCKS asserts each risk path reverts with `EnforcedPause`.

## 6. Construction & ownership (plan §4.1)

Constructor takes `address initialOwner`, reverts on zero, forwards to `Ownable`; no implicit `msg.sender` owner,
no post-deploy initializer. Deploys **unpaused** with an **empty** allowlist (deploy script calls
`setTokenAllowed` explicitly). `nextPlanId` starts at `1`; plan ID `0` is permanently invalid. Ownership transfer
is two-step (`Ownable2Step`).

## 7. Traceability (requirement → surface → test)

| Requirement (source) | Function | Event | Test ID |
| --- | --- | --- | --- |
| Quote before funding (I1, §2.4) | acceptQuote → join | MerchantQuoteAccepted | T-JOIN-BEFORE-QUOTE |
| Threshold ≠ payment (I2, §4.6) | join (threshold branch) | PlanReady | T-READY-NO-TRANSFER |
| Merchant-only settlement (I3, §2.6) | confirmReadyAndSettle | MerchantConfirmed, PlanSettled | T-SETTLE-AUTH, T-SETTLE-WINDOW |
| Rejection refunds (§2.6) | rejectReadyPlan | MerchantRejected | T-REJECT-REFUND |
| Funding expiry refunds (§2.5) | expire | PlanExpired(Funding) | T-EXPIRE-FUNDING |
| Decision expiry refunds (§2.5) | expire | PlanExpired(MerchantDecision) | T-EXPIRE-DECISION |
| Pull refund, once (I4, I8) | claimRefund | RefundClaimed | T-REFUND-PULL, T-REFUND-ONCE |
| Liability paired & exact (I5, I6) | join/leave/claimRefund/settle | ParticipantJoined/Left, PlanSettled, RefundClaimed | T-LIABILITY-PAIR, T-LOCKED-EQ-COUNT |
| Frozen count (I7) | join(threshold)/claimRefund | PlanReady, RefundClaimed | T-COUNT-FROZEN |
| Zero liability at end (I9) | claimRefund / settle | — | T-ZERO-LIABILITY |
| No admin escape (I10, TH-8) | (absence) | — | T-NO-RESCUE, T-NO-UPGRADE |
| Empty cancel (§2.6) | cancelEmptyPlan | PlanCancelled | T-CANCEL-EMPTY, T-CANCEL-NONEMPTY |
| Allowlist policy (TH-9) | setTokenAllowed / createPlan | TokenAllowlistUpdated | T-TOKEN-ALLOWLIST |
| Input bounds (§4.5) | createPlan | PlanCreated | T-BOUNDS-* (one per rule, both edges) |
| Canonical metadata (§6.3) | createPlan (metadataHash) | PlanCreated | T-METADATA-VECTOR |
| Exit-preserving pause (§4.7) | pause/unpause | — | T-PAUSE-EXITS, T-PAUSE-BLOCKS |

## 8. Residual hackathon risks (not claimed as production-grade)

- **Unaudited.** No external audit; 100% branch coverage on monetary paths is the bar, not a substitute.
- **Owner key.** A single deployer key holds pause + allowlist authority; its compromise cannot steal escrowed
  funds (no rescue path) but can pause new activity. No multisig/timelock in scope for Blitz.
- **Token risk.** Only reviewed, allowlisted tokens are usable; the allowlist is a manual control.
- **Off-chain presentation.** Aliases/images live off-chain; if unavailable the reducer still renders correct
  counts/state from logs, showing addresses instead.
- **Not in scope:** upgradeability, dispute resolution, partial refunds, gas-griefing hardening beyond
  no-loop/pull design, formal verification.

## 9. Spec conflicts raised (none silently chosen)

- **Custom-error names** are not enumerated in the plan; §4.5 fixes the *revert conditions* and §4.3 the surface.
  The error set in `IPakkaEscrow.sol` is a faithful transcription of those conditions (one error per revert
  reason). This is a naming freeze, not a semantic deviation. If Lane A's Prompt 03 needs a finer split, it must
  publish the change to Lane C in the same commit (per §4.4's hard-contract rule).
- No other conflict found between plan §2 and §4; the interface, storage, events, bounds, and deadline semantics
  transcribe without contradiction.
