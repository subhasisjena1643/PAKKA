import { describe, expect, it } from "vitest";
import { canonicalMetadataBytes, canonicalMetadataString, metadataHash, type PlanMetadata } from "./metadata";

/**
 * Published test vector (plan §6.3), the twin of packages/contracts/test/Metadata.t.sol. If the digest below
 * does not reproduce, the serializer is wrong — never edit the expected value.
 */
const SAMPLE: PlanMetadata = {
  schemaVersion: 1,
  chainId: 10143,
  escrow: "0x00000000000000000000000000000000000000A1", // upper-case on purpose: must be lowercased
  slug: "room-plan",
  title: "Five-a-side under the purple lights",
  merchantName: "Demo merchant",
  imageUrl: "/plans/room-plan.webp",
  displayUnit: "demo credit",
  disclosure: "DEMO CREDITS — NO CASH VALUE",
};

const EXPECTED_BYTES =
  '{"chainId":10143,"disclosure":"DEMO CREDITS — NO CASH VALUE","displayUnit":"demo credit","escrow":"0x00000000000000000000000000000000000000a1","imageUrl":"/plans/room-plan.webp","merchantName":"Demo merchant","schemaVersion":1,"slug":"room-plan","title":"Five-a-side under the purple lights"}';
const EXPECTED_HASH = "0x3c62747e27075c8eec2e930f7b47197c5b71349eacf89c959f4646bde6ebe9e3"; // public-hash

describe("canonical metadata serializer (plan §6.3)", () => {
  it("produces JCS-sorted keys with lowercase address", () => {
    expect(canonicalMetadataString(SAMPLE)).toBe(EXPECTED_BYTES);
  });

  it("emits 294 UTF-8 bytes with a literal em dash (e2 80 94)", () => {
    const bytes = canonicalMetadataBytes(SAMPLE);
    expect(bytes.length).toBe(294);
    let hasEmDash = false;
    for (let i = 0; i + 2 < bytes.length; i++) {
      if (bytes[i] === 0xe2 && bytes[i + 1] === 0x80 && bytes[i + 2] === 0x94) hasEmDash = true;
    }
    expect(hasEmDash).toBe(true);
  });

  it("reproduces the published keccak256 digest", () => {
    expect(metadataHash(SAMPLE)).toBe(EXPECTED_HASH);
  });
});
