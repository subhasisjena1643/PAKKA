"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { monadTestnet } from "viem/chains";
import SmartWalletProvider from "../hooks/useSmartWallet";

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Privy requires an app ID of exactly 25 chars and throws otherwise (crashing prerender). When it is unset or
  // malformed (bare clone / no env), render without auth so the app still builds; real deploys supply a valid ID.
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId || appId.length !== 25) {
    return <>{children}</>;
  }
  return (
    <BasePrivyProvider
      appId={appId}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          priceDisplay: {
            primary: "native-token",
            secondary: null,
          },
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
      }}
    >
      <SmartWalletProvider>
        {children}
      </SmartWalletProvider>
    </BasePrivyProvider>
  );
}
