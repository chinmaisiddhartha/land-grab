'use client';

import Link from 'next/link';
import { ConnectButton } from './ConnectButton';
import { DemoModeIndicator } from './DemoModeIndicator';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">LandGrab</h1>
            <nav className="flex space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <Link href="/claim" className="text-gray-500 hover:text-gray-700">Claim Land</Link>
              <Link href="/my-lands" className="text-gray-500 hover:text-gray-700">My Lands</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <DemoModeIndicator />
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
