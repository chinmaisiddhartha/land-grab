'use client';

import React from 'react';

interface LandCardProps {
  land: {
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
  };
}

export function LandCard({ land }: LandCardProps) {
  // Extract latitude and longitude from metadata if available
  const latAttribute = land.metadata?.attributes?.find(attr => attr.trait_type === 'latitude');
  const lngAttribute = land.metadata?.attributes?.find(attr => attr.trait_type === 'longitude');
  
  const lat = latAttribute?.value || 'Unknown';
  const lng = lngAttribute?.value || 'Unknown';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {land.metadata?.name || `Land #${land.tokenId}`}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {land.what3words}
        </p>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">Latitude:</span> {lat}
            </div>
            <div>
              <span className="font-medium">Longitude:</span> {lng}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Token ID:</span> {land.tokenId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
