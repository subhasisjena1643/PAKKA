# PAKKA — Live Links

**Filled in by:** [Prompt 15](./PAKKA_BLITZ_PROMPT_PACK.md#prompt-15--deployment-live-links-monitoring-and-rollback)
(release candidate) and [Prompt 18](./PAKKA_BLITZ_PROMPT_PACK.md#prompt-18--d-day-deploy-seed-prove-and-capture)
(D-day).

> **Never prefill anything.** `PENDING` is honest; a plausible-looking invented hash is a false claim made to
> judges.
>
> Two different evidence standards apply, and they are not interchangeable:
>
> | Standard | Applies to | Means |
> | --- | --- | --- |
> | **Directly observed** | URLs, addresses, commits, checksums, block numbers | someone loaded it or read it from generated output |
> | **Receipt-derived** | every transaction hash | a receipt returned `status: success` **and** reached the configured finality threshold ([PLAN §3.3.1](./IMPLEMENTATION_PLAN.md#331-finality-rule--frozen)) |
>
> A transaction hash that exists but has not reached finality is recorded as `SUBMITTED — not final`, never as a
> milestone. Build explorer URLs from the validated chain config, not by hand
> ([PLAN §3.2](./IMPLEMENTATION_PLAN.md#32-monad-integration-facts--reverify-on-d-day)).

---

## Release — directly observed

- Release commit: PENDING
- Manifest checksum (must match `/ops` and the deployed build): PENDING
- Production PWA: PENDING
- Attendee plan: PENDING
- Merchant route: PENDING
- Wall: PENDING
- Ops: PENDING
- Health endpoint: PENDING
- QR asset target URL: PENDING

## Testnet — chain 10143

Label all amounts here `DEMO CREDITS — NO CASH VALUE`.

### Deployment — directly observed

- PakkaEscrow contract: PENDING
- Verified source: PENDING
- DemoINR contract: PENDING
- Deployment block: PENDING
- ABI checksum: PENDING
- Room plan ID: PENDING
- Metadata hash (on chain) / canonical bytes match verified: PENDING

### Milestones — receipt-derived

Record for each: tx hash, block number, and `final` / `SUBMITTED — not final`.

| Milestone | Tx hash | Block | Finality |
| --- | --- | --- | --- |
| Deploy PakkaEscrow | PENDING | PENDING | PENDING |
| Deploy DemoINR | PENDING | PENDING | PENDING |
| `setTokenAllowed` | PENDING | PENDING | PENDING |
| `PlanCreated` | PENDING | PENDING | PENDING |
| `MerchantQuoteAccepted` | PENDING | PENDING | PENDING |
| Representative `ParticipantJoined` | PENDING | PENDING | PENDING |
| `PlanReady` | PENDING | PENDING | PENDING |
| `PlanSettled` | PENDING | PENDING | PENDING |
| Rejected or expired plan | PENDING | PENDING | PENDING |
| `RefundClaimed` | PENDING | PENDING | PENDING |

### Confirmed room metrics

Derived from confirmed logs only — never from realtime, the database, or a screenshot count.

- Confirmed participants: PENDING
- Evidence block (the block height these counts were read at): PENDING
- Read at (UTC): PENDING
- Settled aggregate: PENDING

## Mainnet — chain 143

Gated on [`MAINNET_APPROVAL.md`](./MAINNET_APPROVAL.md). Label all amounts here `REAL MAINNET SETTLEMENT`, and
never add these totals to the testnet totals above.

- Status: NOT ATTEMPTED / SKIPPED SAFELY / COMPLETED — PENDING
- USDC source references checked at (UTC): PENDING
- Resolved USDC address: PENDING
- PakkaEscrow contract: PENDING
- Verified source: PENDING
- PlanCreated: PENDING
- PlanReady: PENDING
- PlanSettled: PENDING

## Fallbacks used

- `VERIFIED REPLAY` invoked: NO / YES — PENDING
- If yes, the original confirmed transaction set replayed: PENDING
- Physical box or digital fallback: PENDING
