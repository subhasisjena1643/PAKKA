// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PakkaConstants — frozen input bounds (plan §4.5, Gate G02)
/// @notice Single source of the bound values. Prompt 04 asserts every one on both inclusive edges. Changing any
/// value after G02 requires a human review note (plan §0.2). Bounds are inclusive at both ends.
library PakkaConstants {
    uint32 internal constant MIN_PARTICIPANTS = 2;
    uint32 internal constant MAX_PARTICIPANTS = 100; // matches reactor segments, §5.6
    uint96 internal constant MAX_CONTRIBUTION = 1_000_000_000; // 1,000 units at 6 decimals
    uint64 internal constant MIN_FUNDING_HORIZON = 60; // 1 minute
    uint64 internal constant MAX_FUNDING_HORIZON = 7 days;
    uint32 internal constant MIN_RESPONSE_WINDOW = 60; // 1 minute
    uint32 internal constant MAX_RESPONSE_WINDOW = 24 hours;
    uint256 internal constant FIRST_PLAN_ID = 1; // nextPlanId starts at 1; plan ID 0 is permanently invalid
}
