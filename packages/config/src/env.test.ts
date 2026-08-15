import { describe, expect, it } from "vitest";
import { clientEnvSchema, serverEnvSchema } from "./env";

const validTestnetClient = {
  NEXT_PUBLIC_CHAIN_MODE: "testnet",
  NEXT_PUBLIC_MONAD_CHAIN_ID: "10143",
  NEXT_PUBLIC_ESCROW_ADDRESS: "0x1234567890123456789012345678901234567890",
  NEXT_PUBLIC_DEMO_TOKEN_ADDRESS: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  NEXT_PUBLIC_DEPLOYMENT_BLOCK: "12345",
  NEXT_PUBLIC_PRIVY_APP_ID: "app-abc",
  NEXT_PUBLIC_PIMLICO_BUNDLER_URL: "https://api.pimlico.io/v2/10143/rpc?apikey=x",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("clientEnvSchema", () => {
  it("accepts a valid testnet config and coerces numeric strings", () => {
    const parsed = clientEnvSchema.parse(validTestnetClient);
    expect(parsed.NEXT_PUBLIC_MONAD_CHAIN_ID).toBe(10143);
    expect(parsed.NEXT_PUBLIC_DEPLOYMENT_BLOCK).toBe(12345);
  });

  it("rejects a chain id that does not match the declared mode", () => {
    expect(() =>
      clientEnvSchema.parse({ ...validTestnetClient, NEXT_PUBLIC_MONAD_CHAIN_ID: "143" }),
    ).toThrow(/does not match testnet/);
  });

  it("rejects a demo token set in mainnet mode (no testnet/mainnet mixing)", () => {
    expect(() =>
      clientEnvSchema.parse({
        ...validTestnetClient,
        NEXT_PUBLIC_CHAIN_MODE: "mainnet",
        NEXT_PUBLIC_MONAD_CHAIN_ID: "143",
      }),
    ).toThrow(/demo token must not be set in mainnet/);
  });

  it("requires a demo token in testnet mode", () => {
    const { NEXT_PUBLIC_DEMO_TOKEN_ADDRESS, ...withoutToken } = validTestnetClient;
    void NEXT_PUBLIC_DEMO_TOKEN_ADDRESS;
    expect(() => clientEnvSchema.parse(withoutToken)).toThrow(/demo token address is required/);
  });

  it("rejects a malformed escrow address", () => {
    expect(() =>
      clientEnvSchema.parse({ ...validTestnetClient, NEXT_PUBLIC_ESCROW_ADDRESS: "0xnope" }),
    ).toThrow();
  });
});

describe("serverEnvSchema", () => {
  const validServer = {
    MONAD_RPC_URL: "https://rpc.example",
    MONAD_BACKUP_RPC_URL: "https://backup.example",
    DEPLOYER_PRIVATE_KEY: "0x" + "a".repeat(64),
    ETHERSCAN_API_KEY: "key",
    BOX_HMAC_SECRET: "a-sufficiently-long-secret",
  };

  it("accepts a valid server config", () => {
    expect(() => serverEnvSchema.parse(validServer)).not.toThrow();
  });

  it("rejects a private key of the wrong length", () => {
    expect(() =>
      serverEnvSchema.parse({ ...validServer, DEPLOYER_PRIVATE_KEY: "0xdead" }),
    ).toThrow();
  });
});
