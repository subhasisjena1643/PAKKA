/**
 * Canonical plan-metadata serializer (Prompt 02 / Gate G02, plan §6.3). THE ONLY place metadata is serialized —
 * scripts/ and apps/web import from here, never re-implement it. Rules (frozen):
 *   - RFC 8785 JSON Canonicalization Scheme (JCS): keys sorted by UTF-16 code unit, no insignificant whitespace,
 *     ECMAScript string escaping (printable non-ASCII like the em dash stays literal UTF-8, NOT \u-escaped).
 *   - All addresses lowercase (casing changes bytes → changes the hash).
 *   - Integers only for schemaVersion and chainId; no floats anywhere.
 *   - hash = keccak256(utf8Bytes(jcs(document))), no length prefix, no trailing newline.
 */
import canonicalize from "canonicalize";
import { keccak256, toBytes, type Hex } from "viem";

/** Versioned canonical shape (plan §6.3). Only values known BEFORE createPlan — never inject planId later. */
export type PlanMetadata = {
  readonly schemaVersion: 1;
  readonly chainId: number;
  readonly escrow: string;
  readonly slug: string;
  readonly title: string;
  readonly merchantName: string;
  readonly imageUrl: string;
  readonly displayUnit: string;
  readonly disclosure: string;
};

/** Lowercase every address-shaped field so casing can never change the canonical bytes. */
function normalize(meta: PlanMetadata): PlanMetadata {
  return { ...meta, escrow: meta.escrow.toLowerCase() };
}

/** The exact UTF-8 bytes committed to by metadataHash. Store these next to the plan record. */
export function canonicalMetadataBytes(meta: PlanMetadata): Uint8Array {
  const jcs = canonicalize(normalize(meta));
  if (jcs === undefined) throw new Error("metadata is not canonicalizable");
  return toBytes(jcs);
}

/** The canonical JCS string (for persistence / debugging). */
export function canonicalMetadataString(meta: PlanMetadata): string {
  const jcs = canonicalize(normalize(meta));
  if (jcs === undefined) throw new Error("metadata is not canonicalizable");
  return jcs;
}

/** keccak256 over the canonical UTF-8 bytes — the value stored on-chain as metadataHash. */
export function metadataHash(meta: PlanMetadata): Hex {
  return keccak256(canonicalMetadataBytes(meta));
}
