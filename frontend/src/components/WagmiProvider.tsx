'use client';

import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { WagmiProvider as Provider } from 'wagmi';
import { ReactNode } from 'react';

// Set up wagmi config
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  connectors: [
    injected(),
  ],
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return (
    <Provider config={config}>
      {children}
    </Provider>
  );
}
