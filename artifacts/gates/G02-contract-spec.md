# G02 — Executable threat model and contract interface freeze

**Prompt:** 02 · **Owner:** A, **co-approved by C** · **Branch:** `chain/spec` · **Base commit:** `4828620`
**Depends on:** G00 · **Date:** 2026-08-15 · **Status:** PASS (Core)
**Sign-off:** A ☑ · C ☑ (single operator holding all three lanes this session; recorded per instruction)

## Binary gate

> Every monetary requirement maps to a state transition and a planned test ID; the metadata test vector
> reproduces the published digest; A and C both sign the interface freeze.

Met. Traceability table (THREAT_MODEL §7) maps each requirement → function → event → stable test ID. The 294-byte
metadata vector reproduces `0x3c62747e27075c8eec2e930f7b47197c5b71349eacf89c959f4646bde6ebe9e3` in **both**
Solidity and TypeScript (evidence below).

## Frozen artifacts

| Artifact | Path |
| --- | --- |
| Solidity interface (enums, struct, errors, events, signatures) | `packages/contracts/src/interfaces/IPakkaEscrow.sol` |
| Input-bound constants (single source for P04) | `packages/contracts/src/PakkaConstants.sol` |
| UI plan-lifecycle type (P07 returns, P09 renders) | `packages/chain/src/lifecycle.ts` |
| Canonical metadata serializer (P06, P11) | `packages/chain/src/metadata.ts` |
| Threat model, invariants, traceability, test IDs | `docs/THREAT_MODEL.md` |

## Frozen event payloads (verbatim — hard contract with the lane C reducer, plan §4.4)

```solidity
event PlanCreated(
    uint256 indexed planId, address indexed creator, address indexed merchant,
    address token, uint256 contribution, uint256 minimumParticipants,
    uint256 fundingDeadline, uint256 merchantResponseWindow, bytes32 metadataHash
);
event MerchantQuoteAccepted(uint256 indexed planId, address indexed merchant);
event ParticipantJoined(uint256 indexed planId, address indexed participant, uint256 participantCount, uint256 totalLocked);
event ParticipantLeft(uint256 indexed planId, address indexed participant, uint256 participantCount, uint256 totalLocked);
event PlanReady(uint256 indexed planId, uint256 readyAt, uint256 merchantDecisionDeadline);
event MerchantConfirmed(uint256 indexed planId, address indexed merchant, uint256 confirmedAt);
event PlanSettled(uint256 indexed planId, address indexed merchant, uint256 totalAmount, uint256 participantCount);
event MerchantRejected(uint256 indexed planId, address indexed merchant);
event PlanExpired(uint256 indexed planId, ExpiryPhase phase);   // ExpiryPhase { Funding, MerchantDecision }
event RefundClaimed(uint256 indexed planId, address indexed participant, uint256 amount);
event PlanCancelled(uint256 indexed planId);
event TokenAllowlistUpdated(address indexed token, bool allowed);
```

Any change to a payload after this gate must be published to lane C in the same commit.

## Commands run and results

| Command | Result |
| --- | --- |
| `forge fmt --check --root packages/contracts` | PASS |
| `forge build --root packages/contracts` | PASS — interface + constants compile (Solc 0.8.24) |
| `forge test --root packages/contracts` | PASS — 4/4 (`MetadataVectorTest` 3/3 incl. digest match; scaffold 1/1) |
| `npm run test` (vitest) | PASS — 10/10 incl. `metadata.test.ts` 3/3 (JCS string, 294 bytes + literal em dash, digest) |
| `npm run typecheck` | PASS — all workspaces clean (lifecycle + metadata types) |

Metadata vector verified identically on both sides: byte length 294, em dash present as literal UTF-8
`e2 80 94`, `keccak256 == 0x3c62747e27075c8eec2e930f7b47197c5b71349eacf89c959f4646bde6ebe9e3`.

## Scope / decisions

- Interface only — no function bodies. Compile-safe: interface, a constants library, and two test-only Solidity
  suites. Bodies + `DemoINR` arrive in Prompt 03 (Lane A).
- Custom-error names are frozen here as a faithful transcription of the plan's revert conditions (§4.5) — the
  plan does not enumerate error identifiers; see THREAT_MODEL §9. No semantic deviation from the plan.
- No participant array and no refund loop appear anywhere in the frozen surface (I4 / TH-13).

## Risks / unresolved

- `evm_version` still solc-default (`foundry.toml`) — confirm vs Monad docs before deploy (Prompt 06).
- Error-name granularity may be refined in P03; if so it must be re-published to lane C per the §4.4 rule.
- Test IDs in THREAT_MODEL §3/§4/§7 are named but not yet implemented — that is Prompts 04/05. This gate freezes
  the mapping, not the tests.

## Hand-off

Frozen interface + event payloads + stable test IDs → Prompts 03, 04, 05, 07 · UI lifecycle type → Prompt 09 ·
canonical serializer → Prompts 06, 11.

**Commit SHA:** `0249c74` (branch `chain/spec`). Prompt 03 NOT started.
