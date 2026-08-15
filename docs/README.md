# PAKKA — documentation index

A group checkout on Monad that settles only when enough people have committed.

> `PAKKA?` → people join → `GROUP READY` → merchant confirms → `PAKKA!`

**Blitz day:** 16 August 2026 · **Team:** 3

**Build status lives in [`../artifacts/gates/README.md`](../artifacts/gates/README.md)** — that index and the
`Gxx-*.md` reports beside it are the only trustworthy answer to "what actually works." Do not restate status
here; it goes stale within hours.

*As of 14 August 2026: specification complete, no gates started. Prompt 01 is the first code-producing step.*

---

## Start here

| If you are… | Read, in order |
| --- | --- |
| A coding agent starting a session | [`SESSION_PREAMBLE.md`](./SESSION_PREAMBLE.md) → [`PAKKA_BLITZ_PROMPT_PACK.md` §4](./PAKKA_BLITZ_PROMPT_PACK.md#4-prompt-index-and-dependency-graph) → your prompt's `Spec refs`. Nothing else — reading all 20,000+ words before a small change is a failure mode, not diligence |
| A human joining the team | [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) §1 → [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) §1–§4 → [`PAKKA_BLITZ_PROMPT_PACK.md` §4](./PAKKA_BLITZ_PROMPT_PACK.md#4-prompt-index-and-dependency-graph) |
| Checking build status | [`../artifacts/gates/`](../artifacts/gates/) — the gate reports are the only record of what is actually green |
| Operating the demo | `DEMO_RUNBOOK.md` and `INCIDENT_FALLBACKS.md` (produced by Prompt 17) |

---

## The four-document structure

Each document has exactly one job. Content is not duplicated between them — it is cross-referenced.

```
PRODUCT_SPEC.md          why and what      — product intent, scope, narrative      (10 Aug, preserved)
        │
        ▼
IMPLEMENTATION_PLAN.md   how, decided      — frozen decisions, invariants, budgets (14 Aug, authoritative)
        │
        ▼
PAKKA_BLITZ_PROMPT_PACK  how, sequenced    — prompts 00–18, gates, dependencies
        │
        ▼
artifacts/gates/*.md     what happened     — evidence, one file per prompt
```

| Document | Job | Editing rule |
| --- | --- | --- |
| [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) | Product intent and scope boundaries | Historical. Do not edit; record changes as supersessions in the plan's §0.3 |
| [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) | Frozen technical decisions, invariants, bounds, budgets | Section numbers are load-bearing — **do not renumber.** Changes to §2 or §4 after Gate G02 need a human review note |
| [`PAKKA_BLITZ_PROMPT_PACK.md`](./PAKKA_BLITZ_PROMPT_PACK.md) | Ordered executable prompts with owners, dependencies, and gates | Keep prompt numbering stable; the dependency graph and gate IDs are referenced from the plan and from CLAUDE.md |
| [`SESSION_PREAMBLE.md`](./SESSION_PREAMBLE.md) | The one screen pasted into every agent session | Keep it to one screen. If it grows, move detail into the plan and cite it |
| [`../CLAUDE.md`](../CLAUDE.md) | Standing rules for coding agents | Keep it a summary. Detail belongs in the plan |

**Authority order** when sources conflict — chain state > implementation plan > product spec > prompt pack >
code comments. Full table: [`IMPLEMENTATION_PLAN.md` §0.2](./IMPLEMENTATION_PLAN.md#02-authority-order).

---

## Working files

Templates now, evidence later. **Never prefill a hash, address, or URL** in any of these.

| File | Filled in by | Contains |
| --- | --- | --- |
| [`LIVE_LINKS.md`](./LIVE_LINKS.md) | Prompts 15, 18 | Every observed URL and transaction hash |
| [`MAINNET_APPROVAL.md`](./MAINNET_APPROVAL.md) | Prompt 18 preflight | Two-human sign-off; any unchecked item means no mainnet proof |
| [`../artifacts/gates/README.md`](../artifacts/gates/README.md) | every prompt | Gate report format and the live gate index |

## Documents produced during the build

Not yet written — each is the exit artifact of a prompt.

| File | Produced by | Contains |
| --- | --- | --- |
| `THREAT_MODEL.md` | Prompt 02 | Actors, threats, invariants, and a stable test ID per threat |
| `DEMO_RUNBOOK.md` | Prompt 17 | Device assignment, exact commands, choreography, speaker lines |
| `INCIDENT_FALLBACKS.md` | Prompt 17 | One operator card per incident: detect → 60-second action → owner → fallback |

## Archive

[`archive/`](./archive/) holds the pre-split combined plan-and-prompt-pack from 14 August 2026. It is superseded
and must not be cited — all section references in this repository point at the live documents above.

---

## The nine rules

The compressed form of [`IMPLEMENTATION_PLAN.md` §2](./IMPLEMENTATION_PLAN.md#2-canonical-product-and-money-rules)
and [§4.6](./IMPLEMENTATION_PLAN.md#46-accounting-rules). Violating any of these is a blocking defect.

1. **Quote before funding** — `join` reverts until the named merchant accepts.
2. **Threshold ≠ payment** — the threshold join sets `Ready` only; the merchant balance must not move.
3. **Merchant-only settlement** — only while `Ready`, only before `decisionDeadline`.
4. **Pull refunds only** — no participant array, no refund loop.
5. **The chain is the only authority** — realtime carries hints, never numbers.
6. **Pending never counts** — solid state needs a receipt *plus* finality confirmations.
7. **No admin escape hatch** — no upgradeability, no rescue while liability is outstanding.
8. **Exit-preserving pause** — refunds survive a pause.
9. **Testnet and mainnet value never mix** — never summed, never visually confused.

> Unaudited hackathon software. Use demo credits on testnet and only tiny mainnet amounts the team can afford to
> lose.
