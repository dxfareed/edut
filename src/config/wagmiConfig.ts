import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { farcasterFrame } from "@farcaster/frame-wagmi-connector"
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [
    farcasterFrame(),
    coinbaseWallet({
      appName: 'TriviaBase',
      preference: 'all', // set this to version '4'
    }),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
