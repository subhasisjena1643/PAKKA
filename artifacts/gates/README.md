# Gate evidence

One file per prompt, named `Gxx-<slug>.md`. These reports are the **only** record of what is actually green — a
fresh agent session reads this directory before trusting any claim about build state
([prompt pack §3](../../docs/PAKKA_BLITZ_PROMPT_PACK.md#3-reading-order-for-a-fresh-session)).

## Rules

- **Never include secrets.** Redact keys, URLs containing credentials, and private keys.
- **Never invent command output, transaction hashes, addresses, or links.** If it was not observed, it is
  `PENDING` or `NOT RUN`.
- **`FAIL` and `BLOCKED` are legitimate statuses.** A fabricated `PASS` corrupts every downstream decision.
- Record what was **cut**, not just what was built — a silent cut becomes a false claim during judging.
- One report per prompt. If a gate is rerun after fixes, append a dated *Rerun* section rather than overwriting
  the original result.
- **A gate passes at Core.** Stretch items (plan §8.6) are recorded as `NOT RUN — stretch`, which is an honest
  pass. Named cut variants — digital box, direct polling, two viewports instead of five, mainnet
  `SKIPPED SAFELY` — also pass; say which variant you used.

## Template

```md
# Gxx — <title>

- Prompt: xx
- Owner: A | B | C
- Branch / commit SHA:
- Date (UTC):
- Depends on: <upstream gates, and whether each was green>
- Status: PASS | FAIL | BLOCKED

## Commands run
<command → exit status → key output, verbatim, secrets redacted>

## Changed files

## Evidence
<addresses, tx hashes, links, measurements — only if actually observed>

## Hand-off
<what downstream prompts can now rely on>

## Risks / TODO / accepted findings
<each with an owner; accepted findings also need rationale, impact, workaround, expiry>
```

## Index

Update the status column as gates close. Prompt definitions and dependencies:
[prompt pack §4](../../docs/PAKKA_BLITZ_PROMPT_PACK.md#4-prompt-index-and-dependency-graph).

| Gate | Prompt | Owner | Expected file | Status |
| --- | --- | --- | --- | --- |
| G00 | 00 repository audit — **run once globally**, A owns, B/C countersign | A | `G00-orientation.md` | PASS (B/C countersign pending) |
| G01 | 01 scaffold and pin | B | `G01-baseline.md` | PASS (Core) |
| G02 | 02 threat model + interface freeze | A | `G02-contract-spec.md` | PASS (Core) |
| G03 | 03 implement contracts | A | `G03-contracts.md` | not started |
| G04 | 04 contract tests | A | `G04-contract-tests.md` | not started |
| G05 | 05 red-team review | A | `G05-security-review.md` | not started |
| G06 | 06 deploy + seed + smoke | A | `G06-deployment.md` | not started |
| G07a | 07 reducer core (needs G02, G03) | C | `G07-chain-reducer.md` | not started |
| G07b | 07 manifest binding (needs G07a + G06) | C | `G07-chain-reducer.md` | not started |
| G08 | 08 sponsored batches | B | `G08-sponsored-flow.md` | not started |
| G09 | 09 design system | B | `G09-design-system.md` | not started |
| G10 | 10 attendee experience | B | `G10-attendee.md` | not started |
| G11 | 11 merchant/receipt/ops | B | `G11-operator-surfaces.md` | not started |
| G12 | 12 wall + Purple Box | C | `G12-live-wall.md` | not started |
| G13 | 13 PWA resilience | B + C | `G13-resilience.md` | not started |
| G14 | 14 end-to-end suite | B/C | `G14-e2e.md` | not started |
| G15 | 15 release candidate | A | `G15-release-candidate.md` | not started |
| G16 | 16 release review | all | `G16-release-review.md` | not started |
| G17 | 17 demo freeze | C | `G17-freeze.md` | not started |
| G18 | 18 D-day live | A | `G18-live.md` | not started |

Two gates are **schema freezes** that downstream lanes build against in parallel — breaking one after the fact
requires notifying every consuming lane:

- **G02** freezes the Solidity interface and event payloads → consumed by G03, G04, G05, G07.
- **G06** freezes the `deployments/<chainId>.json` manifest → consumed by G07, G08, G11, G12, G15.
