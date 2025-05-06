import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { sepolia } from 'wagmi/chains'

// 1. Define constants
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

// 2. Create wagmiConfig
const metadata = {
  name: 'LandGrab',
  description: 'Claim, trade, and manage digital land parcels using what3words addresses on the blockchain',
  url: 'https://landgrab.app', // Update with your website
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create chains array correctly
const chains = [sepolia]

export const wagmiConfig = defaultWagmiConfig({
  chains: [sepolia] as const,
  projectId,
  metadata
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#10b981', 
  }
})