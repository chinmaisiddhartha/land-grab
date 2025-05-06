'use client';

import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ReleaseLand } from "@/components/ReleaseLand";
import { ProposeSwap } from "@/components/ProposeSwap";
import Link from "next/link";
import React from "react";

interface LandAttribute {
  trait_type: string;
  value: string;
}

interface LandMetadata {
  name: string;
  description: string;
  attributes: LandAttribute[];
}

interface LandInfo {
  tokenId: string;
  what3words: string;
  metadata: LandMetadata;
}

export default function MyLandsPage() {
  const { address, isConnected } = useAccount();
  const [lands, setLands] = useState<LandInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLand, setSelectedLand] = useState<LandInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'release' | 'swap'>('info');

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLands();
    } else {
      setLands([]);
      setIsLoading(false);
    }
  }, [address, isConnected]);

  const fetchUserLands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching lands for address: ${address}`);
      const response = await fetch(`/api/blockchain/user-lands/${address}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching lands: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched lands data:', data);
      
      if (Array.isArray(data.lands)) {
        setLands(data.lands);
      } else {
        console.warn('Unexpected response format:', data);
        setLands([]);
      }
    } catch (err) {
      console.error('Error fetching user lands:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch your lands');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLandSelect = (land: LandInfo) => {
    setSelectedLand(land);
    setActiveTab('info');
  };

  const handleTabChange = (tab: 'info' | 'release' | 'swap') => {
    setActiveTab(tab);
  };

  const handleSuccess = () => {
    // Refresh the lands list after a successful operation
    fetchUserLands();
    setSelectedLand(null);
  };

  // Find latitude and longitude from metadata attributes
  const getCoordinates = (land: LandInfo) => {
    if (!land.metadata || !land.metadata.attributes) return { lat: null, lng: null };
    
    const lat = land.metadata.attributes.find(attr => attr.trait_type === 'latitude')?.value;
    const lng = land.metadata.attributes.find(attr => attr.trait_type === 'longitude')?.value;
    
    return { lat, lng };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">My Lands</h1>
        
        {!isConnected ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500 mb-4">Please connect your wallet to view your lands</p>
          </div>
        ) : isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500">Loading your lands...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchUserLands}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : lands.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500 mb-4">You don't own any land yet</p>
            <Link 
              href="/claim"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
            >
              Claim Your First Land
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Your Land Parcels</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {lands.map((land) => (
                  <div 
                    key={land.tokenId}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedLand?.tokenId === land.tokenId 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleLandSelect(land)}
                  >
                    <p className="font-medium">{land.metadata?.name || `Land #${land.tokenId}`}</p>
                    <p className="text-sm text-gray-500 font-mono">{land.what3words}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              {selectedLand ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex border-b mb-4">
                    <button
                      className={`py-2 px-4 ${activeTab === 'info' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => handleTabChange('info')}
                    >
                      Land Info
                    </button>
                    <button
                      className={`py-2 px-4 ${activeTab === 'release' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => handleTabChange('release')}
                    >
                      Release Land
                    </button>
                    <button
                      className={`py-2 px-4 ${activeTab === 'swap' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                      onClick={() => handleTabChange('swap')}
                    >
                      Propose Swap
                    </button>
                  </div>
                  
                  {activeTab === 'info' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{selectedLand.metadata?.name || `Land #${selectedLand.tokenId}`}</h2>
                      <p className="text-gray-600 mb-4">{selectedLand.metadata?.description}</p>
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Details</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-gray-500">Token ID:</div>
                          <div className="text-sm font-mono">{selectedLand.tokenId}</div>
                          
                          <div className="text-sm text-gray-500">what3words:</div>
                          <div className="text-sm font-mono">{selectedLand.what3words}</div>
                          
                          {selectedLand.metadata?.attributes?.map((attr, index) => (
                            <React.Fragment key={index}>
                              <div className="text-sm text-gray-500">{attr.trait_type}:</div>
                              <div className="text-sm">{attr.value}</div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Location</h3>
                        <div className="bg-gray-100 p-4 rounded-md">
                          <a 
                            href={`https://what3words.com/${selectedLand.what3words}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View on what3words Map
                          </a>
                          
                          {getCoordinates(selectedLand).lat && getCoordinates(selectedLand).lng && (
                            <div className="mt-2">
                              <a 
                                href={`https://www.google.com/maps?q=${getCoordinates(selectedLand).lat},${getCoordinates(selectedLand).lng}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View on Google Maps
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'release' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Release Land</h2>
                      <p className="mb-4 text-gray-600">
                        Releasing this land will permanently remove your ownership. This action cannot be undone.
                      </p>
                      <ReleaseLand 
                        what3words={selectedLand.what3words} 
                        onSuccess={handleSuccess} 
                      />
                    </div>
                  )}
                  
                  {activeTab === 'swap' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Propose Land Swap</h2>
                      <ProposeSwap 
                        what3words={selectedLand.what3words} 
                        onSuccess={handleSuccess} 
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <p className="text-gray-500">Select a land to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}