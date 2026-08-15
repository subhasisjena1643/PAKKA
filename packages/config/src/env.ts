import { z } from "zod";

/**
 * Strict, startup-time environment schema for PAKKA (plan §6.2).
 *
 * Two schemas, deliberately separate: `clientEnvSchema` covers the NEXT_PUBLIC_* values that Next.js inlines
 * into the browser bundle; `serverEnvSchema` covers CLI/server secrets that must NEVER reach the client. A
 * secret with a NEXT_PUBLIC_ prefix is a blocking defect — the static `verify:no-secrets` check guards the
 * committed tree, and keeping secrets out of the client schema guards the runtime.
 *
 * Four client values (chain id, escrow address, demo token, deployment block) are generated from
 * deployments/<chainId>.json by `config:emit` (plan §6.2.1); the schema still validates their shape.
 */

const CHAIN_ID_BY_MODE = { testnet: 10143, mainnet: 143 } as const;

const evmAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "must be a 0x-prefixed 20-byte address");

const privateKey = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "must be a 0x-prefixed 32-byte private key");

export const clientEnvSchema = z
  .object({
    NEXT_PUBLIC_CHAIN_MODE: z.enum(["testnet", "mainnet"]),
    NEXT_PUBLIC_MONAD_CHAIN_ID: z.coerce.number().int().positive(),
    NEXT_PUBLIC_ESCROW_ADDRESS: evmAddress,
    NEXT_PUBLIC_DEMO_TOKEN_ADDRESS: evmAddress.optional(),
    NEXT_PUBLIC_DEPLOYMENT_BLOCK: z.coerce.number().int().nonnegative(),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),
    NEXT_PUBLIC_PRIVY_CLIENT_ID: z.string().optional(),
    NEXT_PUBLIC_PIMLICO_BUNDLER_URL: z.string().url(),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  })
  .superRefine((v, ctx) => {
    // Rule 9 — testnet and mainnet value never mix. Chain id must match the declared mode, and the demo token
    // exists only on testnet.
    const expected = CHAIN_ID_BY_MODE[v.NEXT_PUBLIC_CHAIN_MODE];
    if (v.NEXT_PUBLIC_MONAD_CHAIN_ID !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_MONAD_CHAIN_ID"],
        message: `chain id ${v.NEXT_PUBLIC_MONAD_CHAIN_ID} does not match ${v.NEXT_PUBLIC_CHAIN_MODE} mode (expected ${expected})`,
      });
    }
    if (v.NEXT_PUBLIC_CHAIN_MODE === "mainnet" && v.NEXT_PUBLIC_DEMO_TOKEN_ADDRESS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_DEMO_TOKEN_ADDRESS"],
        message: "demo token must not be set in mainnet mode (DemoINR is testnet-only)",
      });
    }
    if (v.NEXT_PUBLIC_CHAIN_MODE === "testnet" && !v.NEXT_PUBLIC_DEMO_TOKEN_ADDRESS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_DEMO_TOKEN_ADDRESS"],
        message: "demo token address is required in testnet mode",
      });
    }
  });

export const serverEnvSchema = z.object({
  MONAD_RPC_URL: z.string().url(),
  MONAD_BACKUP_RPC_URL: z.string().url(),
  DEPLOYER_PRIVATE_KEY: privateKey,
  ETHERSCAN_API_KEY: z.string().min(1),
  BOX_HMAC_SECRET: z.string().min(16, "must be at least 16 characters"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Parse and validate client env. Throws a ZodError listing every problem at once. */
export function parseClientEnv(env: Record<string, string | undefined> = process.env): ClientEnv {
  return clientEnvSchema.parse(env);
}

/** Parse and validate server/CLI env. Never call this from client code. */
export function parseServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  return serverEnvSchema.parse(env);
}
