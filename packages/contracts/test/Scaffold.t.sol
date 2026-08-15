// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

/// @dev Prompt 01 scaffold sanity check: proves the Foundry test pipeline compiles and runs at the pinned
/// solc ^0.8.24. This asserts nothing about PAKKA behaviour — PakkaEscrow and its tests arrive in Prompt 03
/// (Lane A). It exists only so `contracts:test` is a green, non-empty run in the release gate.
contract ScaffoldTest is Test {
    function test_toolchainRuns() public pure {
        assertEq(uint256(1) + 1, 2);
    }
}
