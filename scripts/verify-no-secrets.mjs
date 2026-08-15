#!/usr/bin/env node
/**
 * verify:no-secrets (plan §8.1) — fails the gate when the committed tree contains a real .env file or a
 * private-key-shaped value. Static, tree-only; it does not read runtime env.
 *
 * Rules:
 *  1. No tracked `.env` / `.env.*` file may be committed, except `.env.example`.
 *  2. No `NEXT_PUBLIC_` variable may be assigned a private-key-shaped value.
 *  3. A private-key-shaped value (0x + 64 hex, not the all-zero placeholder) may not appear in source/config.
 *     Markdown is exempt from the bare-hash scan because confirmed transaction/block hashes share that shape
 *     and legitimately appear in gate evidence (docs/LIVE_LINKS.md). Markdown is still scanned for explicit
 *     key/secret assignments.
 *
 * Exemptions (kept narrow so real keys still fail):
 *  - Vendored third-party code under packages/contracts/lib/ (forge-std, OpenZeppelin) is not our secret to
 *    manage and legitimately ships key-shaped test fixtures.
 *  - A 32-byte hex constant explicitly annotated `// public-hash` (or `no-secret`) on the same line — a human
 *    vouching for a public value such as a keccak256 test vector, block hash, or tx hash. An unannotated bare
 *    key-shaped value still fails.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const KEY_SHAPE = /(?<![0-9a-fA-F])0x[0-9a-fA-F]{64}(?![0-9a-fA-F])/g;
const ZERO_KEY = "0x" + "0".repeat(64);
const NUL = String.fromCharCode(0);
const SKIP_EXT = new Set([".woff", ".woff2", ".ico", ".png", ".jpg", ".jpeg", ".gif", ".gz", ".webp"]);
const SECRET_ASSIGN =
  /(PRIVATE_KEY|SECRET|MNEMONIC|SEED_PHRASE|PASSWORD)\s*[:=]\s*['"]?0x?[0-9a-fA-F]{16,}/i;
const PUBLIC_HASH_ANNOTATION = /\/\/\s*(public-hash|no-secret|not-a-secret)/i;
const VENDORED = "packages/contracts/lib/";

const findings = [];

let tracked;
try {
  tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
} catch (err) {
  console.error("verify:no-secrets: could not list tracked files:", err.message);
  process.exit(2);
}

for (const file of tracked) {
  const base = file.split("/").pop();

  // Rule 1 — committed env files.
  if (/^\.env(\..+)?$/.test(base) && base !== ".env.example") {
    findings.push(`${file}: committed environment file (only .env.example may be tracked)`);
    continue;
  }

  if (base === "package-lock.json" || base === "yarn.lock" || base === "pnpm-lock.yaml") continue;
  if (SKIP_EXT.has(extname(file).toLowerCase())) continue;
  if (file.startsWith(VENDORED)) continue; // vendored third-party (forge-std, OZ)

  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // unreadable
  }
  if (text.includes(NUL)) continue; // binary

  const isMarkdown = extname(file).toLowerCase() === ".md";
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const ln = i + 1;

    // Rule 2 — a NEXT_PUBLIC_ var carrying a key-shaped value.
    if (/NEXT_PUBLIC_[A-Z0-9_]*\s*[:=].*0x[0-9a-fA-F]{64}(?![0-9a-fA-F])/.test(line) && !line.includes(ZERO_KEY)) {
      findings.push(`${file}:${ln}: NEXT_PUBLIC_ variable assigned a private-key-shaped value`);
    }

    // Rule 3 — explicit secret assignment anywhere (incl. markdown).
    if (
      SECRET_ASSIGN.test(line) &&
      !line.includes(ZERO_KEY) &&
      !/\b(example|placeholder|change_me)\b/i.test(line) &&
      base !== ".env.example"
    ) {
      findings.push(`${file}:${ln}: possible secret assignment`);
    }

    // Rule 3 — bare key-shaped value in non-markdown source/config.
    if (!isMarkdown && base !== ".env.example" && !PUBLIC_HASH_ANNOTATION.test(line)) {
      const matches = line.match(KEY_SHAPE);
      if (matches) {
        for (const m of matches) {
          if (m.toLowerCase() !== ZERO_KEY) {
            findings.push(`${file}:${ln}: private-key-shaped value ${m.slice(0, 6)}…${m.slice(-4)}`);
          }
        }
      }
    }
  });
}

if (findings.length > 0) {
  console.error("verify:no-secrets FAILED:\n" + findings.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
console.log(`verify:no-secrets OK — scanned ${tracked.length} tracked files, no secrets found.`);
