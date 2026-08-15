// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

/// @dev Canonical metadata test vector (plan §6.3), frozen at G02. The 294 UTF-8 bytes are the RFC 8785 JCS
/// output of the sample document (keys sorted, em dash kept literal as e2 80 94). keccak256 over those exact
/// bytes must equal the published digest. TS reproduces the same digest in packages/chain/src/metadata.test.ts.
/// If this fails, the serializer is wrong — never edit the expected digest (plan: "regenerate rather than retype").
contract MetadataVectorTest is Test {
    // unicode"" keeps the em dash as literal UTF-8 bytes (e2 80 94), not an escaped —.
    bytes internal constant CANONICAL = bytes(
        unicode'{"chainId":10143,"disclosure":"DEMO CREDITS — NO CASH VALUE","displayUnit":"demo credit","escrow":"0x00000000000000000000000000000000000000a1","imageUrl":"/plans/room-plan.webp","merchantName":"Demo merchant","schemaVersion":1,"slug":"room-plan","title":"Five-a-side under the purple lights"}'
    );
    bytes32 internal constant EXPECTED = 0x3c62747e27075c8eec2e930f7b47197c5b71349eacf89c959f4646bde6ebe9e3; // public-hash

    function test_canonicalByteLength() public pure {
        assertEq(CANONICAL.length, 294);
    }

    function test_emDashIsLiteralUtf8() public pure {
        // Byte offset of the em dash inside `DEMO CREDITS — NO CASH VALUE`: assert e2 80 94 appears.
        bool found;
        for (uint256 i = 0; i + 2 < CANONICAL.length; i++) {
            if (CANONICAL[i] == 0xe2 && CANONICAL[i + 1] == 0x80 && CANONICAL[i + 2] == 0x94) {
                found = true;
                break;
            }
        }
        assertTrue(found, "em dash must be literal UTF-8 e2 80 94");
    }

    function test_keccakMatchesPublishedDigest() public pure {
        assertEq(keccak256(CANONICAL), EXPECTED);
    }
}
