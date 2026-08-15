// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPakkaEscrow — frozen contract interface (Prompt 02 / Gate G02)
/// @notice Types, custom errors, events (with final indexed layout), and external signatures for PakkaEscrow.
/// Transcribed from IMPLEMENTATION_PLAN §4.1–§4.7 and §2.4–§2.6. Values are frozen: changing any storage field,
/// event payload, error, signature, or constant after G02 requires a human review note and notice to lane C.
/// Prompt 03 (Lane A) implements the bodies; Prompt 07 (Lane C) builds the reducer against the events below.
interface IPakkaEscrow {
    // ─── Enums (plan §4.2) ───────────────────────────────────────────────────────────────────────────────
    enum PlanState {
        None, // 0 — plan ID 0 is permanently invalid; distinguishes "unset" from a real plan
        AwaitingQuote,
        Open,
        Ready,
        Settled,
        Expired,
        Rejected,
        Cancelled
    }

    /// @dev Which timed deadline drove an expiry, so the reducer/UI can explain it without off-chain data.
    enum ExpiryPhase {
        Funding,
        MerchantDecision
    }

    // ─── Storage struct (plan §4.2) ──────────────────────────────────────────────────────────────────────
    struct Plan {
        address creator;
        address merchant;
        address token;
        uint96 contribution;
        uint32 minimumParticipants;
        uint32 participantCount; // live active count while Open; frozen terminal snapshot after Ready
        uint64 fundingDeadline;
        uint64 readyAt;
        uint32 merchantResponseWindow;
        uint128 totalLocked;
        bytes32 metadataHash;
        PlanState state;
    }

    // ─── Custom errors ───────────────────────────────────────────────────────────────────────────────────
    // createPlan validation (plan §4.5)
    error ZeroAddress();
    error InvalidContribution(); // == 0 or > MAX_CONTRIBUTION
    error InvalidParticipants(); // < MIN_PARTICIPANTS or > MAX_PARTICIPANTS
    error InvalidFundingDeadline(); // outside [now+MIN_FUNDING_HORIZON, now+MAX_FUNDING_HORIZON]
    error InvalidResponseWindow(); // outside [MIN_RESPONSE_WINDOW, MAX_RESPONSE_WINDOW]
    error AggregateOverflow(); // contribution * minimumParticipants > uint128 max
    error TokenNotAllowed();
    error MetadataRequired(); // metadataHash == bytes32(0)
    // authority / state guards (plan §2.6)
    error PlanNotFound(); // planId == 0 or >= nextPlanId
    error WrongState(PlanState expected, PlanState actual);
    error NotMerchant();
    error NotCreator();
    error NotParticipant();
    error AlreadyJoined();
    error PlanFull(); // participantCount already at minimumParticipants when Ready is set
    // deadline guards (plan §2.5)
    error FundingClosed(); // acceptQuote/join/leave after fundingDeadline
    error FundingNotElapsed(); // expire(Funding) before fundingDeadline
    error DecisionClosed(); // confirmReadyAndSettle at/after decisionDeadline
    error DecisionNotElapsed(); // expire(MerchantDecision) before decisionDeadline
    // accounting / refunds (plan §4.6)
    error BalanceDeltaMismatch(); // fee-on-transfer / rebasing token: actual delta != contribution
    error AlreadyRefunded();
    error NothingToRefund();
    error PlanNotEmpty(); // cancelEmptyPlan with active members

    // ─── Events (plan §4.4) — indexed layout is a HARD CONTRACT with the reducer ──────────────────────────
    event PlanCreated(
        uint256 indexed planId,
        address indexed creator,
        address indexed merchant,
        address token,
        uint256 contribution,
        uint256 minimumParticipants,
        uint256 fundingDeadline,
        uint256 merchantResponseWindow,
        bytes32 metadataHash
    );
    event MerchantQuoteAccepted(uint256 indexed planId, address indexed merchant);
    event ParticipantJoined(
        uint256 indexed planId, address indexed participant, uint256 participantCount, uint256 totalLocked
    );
    event ParticipantLeft(
        uint256 indexed planId, address indexed participant, uint256 participantCount, uint256 totalLocked
    );
    event PlanReady(uint256 indexed planId, uint256 readyAt, uint256 merchantDecisionDeadline);
    event MerchantConfirmed(uint256 indexed planId, address indexed merchant, uint256 confirmedAt);
    event PlanSettled(uint256 indexed planId, address indexed merchant, uint256 totalAmount, uint256 participantCount);
    event MerchantRejected(uint256 indexed planId, address indexed merchant);
    event PlanExpired(uint256 indexed planId, ExpiryPhase phase);
    event RefundClaimed(uint256 indexed planId, address indexed participant, uint256 amount);
    event PlanCancelled(uint256 indexed planId);
    event TokenAllowlistUpdated(address indexed token, bool allowed);

    // ─── External surface (plan §4.3) — no rescue/sweep/withdraw/migrate/upgrade exists ──────────────────
    function createPlan(
        address merchant,
        address token,
        uint96 contribution,
        uint32 minimumParticipants,
        uint64 fundingDeadline,
        uint32 merchantResponseWindow,
        bytes32 metadataHash
    ) external returns (uint256 planId);

    function acceptQuote(uint256 planId) external;
    function join(uint256 planId) external;
    function leave(uint256 planId) external;
    function expire(uint256 planId) external;
    function confirmReadyAndSettle(uint256 planId) external;
    function rejectReadyPlan(uint256 planId) external;
    function claimRefund(uint256 planId) external;
    function cancelEmptyPlan(uint256 planId) external;
    function getPlan(uint256 planId) external view returns (Plan memory);
    function setTokenAllowed(address token, bool allowed) external;
    function pause() external;
    function unpause() external;
}
