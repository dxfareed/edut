"use client";
import React from "react";
import { useEffect } from "react"
import { ThirdwebProvider } from "thirdweb/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import Header from "./Header";
import { Analytics } from "@vercel/analytics/react";
import FrameSDK from "@farcaster/frame-sdk";

// Create a client
const queryClient = new QueryClient();

// Configure Wagmi
const config = createConfig({
  chains: [mainnet],
});

function FarcasterFrameProvider({ children }) {
  useEffect(() => {
    const load = async () => {
      FrameSDK.actions.ready()
    }
    load()
  }, []);

  return <>{children}</>;
}

export default function ClientLayout({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterFrameProvider>
          <ThirdwebProvider>
            <Header />
            <Analytics />
            {children}
          </ThirdwebProvider>
        </FarcasterFrameProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
