# PAKKA — Mainnet Approval

**Policy:** [PLAN §4.8](./IMPLEMENTATION_PLAN.md#48-mainnet-token-policy) and
[§8.5](./IMPLEMENTATION_PLAN.md#85-mainnet-approval)
**Consumed by:**
[Prompt 06](./PAKKA_BLITZ_PROMPT_PACK.md#prompt-06--deterministic-deployment-verification-seeding-and-smoke-scripts)
builds and tests the guard that reads this file — it expects the file to be **incomplete** at that stage and
proves that an incomplete file blocks a broadcast.
[Prompt 18](./PAKKA_BLITZ_PROMPT_PACK.md#prompt-18--d-day-deploy-seed-prove-and-capture) step 9 is the only
place a **completed** approval is required.

> **Two humans initial every item.** Any unchecked item means **no mainnet proof** — and skipping mainnet safely
> is a recorded success, not a failure. The testnet crowd plan is the primary demo either way.
>
> The mainnet proof is item 6 on the cut ladder ([PLAN §9.2](./IMPLEMENTATION_PLAN.md#92-feature-cut-order)).
> Cutting it costs nothing that matters.

---

## Preconditions

| # | Item | Approver 1 | Approver 2 |
| --- | --- | --- | --- |
| 1 | chain ID read from RPC is exactly `143` | | |
| 2 | current Circle **and** Monad token-list sources agree on the native USDC address and decimals | | |
| 3 | bytecode, explorer verification/label, `name`, `symbol`, `decimals` all checked on chain | | |
| 4 | escrow source verified; owner, pause state, and allowlist inspected | | |
| 5 | exact maximum total exposure printed, and affordable to lose | | |
| 6 | participant smart-account addresses, balances, and the merchant address verified **twice** | | |
| 7 | sponsor/bundler supports chain `143` and the policy is narrowly scoped | | |
| 8 | the full exact flow succeeded **twice on testnet**; if a prior independently approved mainnet rehearsal exists, it also succeeded | | |
| 9 | refund plan and emergency-stop wording ready | | |
| 10 | no personal treasury or valuable wallet is connected | | |
| 11 | both approvers understand the unaudited-contract risk | | |

## Recorded values

Fill in only from observed output. Never from a document, a prior run, or memory.

- Date/time of resolution (UTC): PENDING
- Circle reference checked: PENDING
- Monad token-list commit/ref checked: PENDING
- Resolved USDC address: PENDING
- `name` / `symbol` / `decimals` read on chain: PENDING
- Contribution amount per participant: PENDING
- Participant count: PENDING
- **Maximum total exposure:** PENDING
- Merchant address: PENDING
- Escrow address and owner: PENDING

## Sign-off

| Role | Name | Date (UTC) | Signature/initials |
| --- | --- | --- | --- |
| Approver 1 | | | |
| Approver 2 | | | |

## Decision

- [ ] **APPROVED** — proceed with the tiny rehearsed flow only, exactly as recorded above.
- [ ] **SKIPPED SAFELY** — reason: PENDING

Record the outcome in [`LIVE_LINKS.md`](./LIVE_LINKS.md) under *Mainnet — chain 143* and in
`artifacts/gates/G18-live.md`.
