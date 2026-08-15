/**
 * Frozen UI plan-lifecycle type (Prompt 02 / Gate G02, plan §2.4, §3.2, §5).
 *
 * This is the discriminated union that Prompt 07's reducer RETURNS and Prompt 09's design system RENDERS.
 * Freezing it here lets both lanes build in parallel with no adapter layer. It is type-only — no Solidity, no
 * runtime dependency. The CONFIRMED state and the PENDING overlay are deliberately separate values: the reactor
 * receives typed confirmed state plus a separate pending overlay and must never infer state from a percentage,
 * and must never label `Ready` as settled (invariant #2, #6).
 */

/** On-chain plan states, mirroring PlanState in IPakkaEscrow.sol (plan §4.2). */
export type ConfirmedPlanState =
  | "AwaitingQuote"
  | "Open"
  | "Ready"
  | "Settled"
  | "Expired"
  | "Rejected"
  | "Cancelled";

/** Why a plan expired, mirroring ExpiryPhase (plan §4.2). */
export type ExpiryPhase = "Funding" | "MerchantDecision";

/**
 * The confirmed lifecycle a surface can be in. Every field here is reconstructable from confirmed logs alone
 * (plan §4.4) reconciled against getPlan — never from optimistic client state. `count` is the confirmed active
 * count while `open`, then the frozen terminal snapshot from `ready` onward.
 */
export type ConfirmedLifecycle =
  /** No plan / plan ID 0 — nothing to render. */
  | { readonly kind: "empty" }
  /** AwaitingQuote — merchant has not accepted the immutable quote; funding cannot open (invariant #1). */
  | { readonly kind: "awaiting-quote"; readonly planId: bigint; readonly required: number }
  /** Open and below threshold. `count` confirmed contributions of `required`. */
  | { readonly kind: "open"; readonly planId: bigint; readonly count: number; readonly required: number }
  /**
   * Ready — threshold reached, NOTHING transferred. Renders "GROUP READY — awaiting merchant", never PAKKA!
   * (invariant #2). `count` is the frozen terminal snapshot; `decisionDeadline` is readyAt + responseWindow.
   */
  | {
      readonly kind: "ready";
      readonly planId: bigint;
      readonly count: number;
      readonly readyAt: number;
      readonly decisionDeadline: number;
    }
  /** Settled — merchant confirmed, whole pool moved atomically. The only state that may render PAKKA!/gold. */
  | {
      readonly kind: "settled";
      readonly planId: bigint;
      readonly count: number;
      readonly totalAmount: bigint;
      readonly confirmedAt: number;
    }
  /** Released — refunds available (Expired or Rejected). Grey; refunds are pull-based (invariant #4). */
  | {
      readonly kind: "released";
      readonly planId: bigint;
      readonly reason: "expired-funding" | "expired-decision" | "rejected";
    }
  /** Cancelled — empty plan cancelled by its creator. Terminal, no money ever moved. */
  | { readonly kind: "cancelled"; readonly planId: bigint };

/** Discriminator union tag for exhaustive switches. */
export type LifecycleKind = ConfirmedLifecycle["kind"];

/**
 * The SEPARATE pending overlay. Optimistic UI animates amber from this; it may never increment the confirmed
 * `count` above (invariant #6). A pending op goes solid only after a successful receipt PLUS the configured
 * finality depth, at which point it disappears from the overlay and the confirmed lifecycle advances.
 */
export type PendingOverlay = {
  /** Optimistic in-flight self-join for this plan, if any (drives an amber, uncounted segment). */
  readonly selfJoinPending: boolean;
  /** Count of other amber, uncounted in-flight joins observed (hints only — never authoritative). */
  readonly pendingJoins: number;
  /** Tracked op status for the current user's action (plan §3.3). */
  readonly op?: "submitted" | "receipt-seen" | "finalized" | "reverted" | "timed-out" | "superseded";
};

/** What Prompt 07 returns and Prompt 09 renders: confirmed state and its independent pending overlay. */
export type PlanLifecycleView = {
  readonly confirmed: ConfirmedLifecycle;
  readonly pending: PendingOverlay;
};
