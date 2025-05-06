'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { LandCard } from '@/components/LandCard';
import { ReleaseLand } from '@/components/ReleaseLand';

// Define the Land type to fix type errors
interface Land {
  tokenId: string;
  what3words: string;
  metadata?: {
    name?: string;
    description?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export default function ReleasePage() {
  const { address } = useAccount();
  const [myLands, setMyLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchMyLands() {
      try {
        setLoading(true);
        const response = await fetch(`/api/blockchain/user-lands/${address}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching lands: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMyLands(data.lands || []);
      } catch (err) {
        console.error('Error fetching lands:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchMyLands();
  }, [address]);

  const handleSuccess = () => {
    // Refresh the lands list after successful release
    if (address) {
      fetchMyLands();
      setSelectedLand(null);
    }
  };

  async function fetchMyLands() {
    try {
      setLoading(true);
      const response = await fetch(`/api/blockchain/user-lands/${address}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching lands: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMyLands(data.lands || []);
    } catch (err) {
      console.error('Error fetching lands:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Release Land</h1>
      
      {!address ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <p className="text-yellow-700">Please connect your wallet to view your lands.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      ) : myLands.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <p className="text-blue-700">You don't own any land yet. Claim some land first!</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select a land to release:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myLands.map((land) => (
              <div 
                key={land.tokenId}
                onClick={() => setSelectedLand(land)}
                className={`cursor-pointer transition-all ${selectedLand?.tokenId === land.tokenId ? 'ring-2 ring-blue-500' : ''}`}
              >
                <LandCard land={land} />
              </div>
            ))}
          </div>
          
          {selectedLand && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Release this land:</h2>
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
                <p className="text-red-700">
                  Warning: Releasing land is permanent. You will lose ownership of this land.
                </p>
              </div>
              <ReleaseLand 
                what3words={selectedLand.what3words} 
                onSuccess={handleSuccess}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
