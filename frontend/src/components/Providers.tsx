'use client';

import { ReactNode } from 'react';
import { Web3ModalProvider } from './Web3ModalProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3ModalProvider>
      {children}
    </Web3ModalProvider>
  );
}
