'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LAND_MARKET_ADDRESS, LAND_MARKET_ABI } from '@/config/blockchain';

interface ReleaseLandProps {
  what3words: string;
  onSuccess?: () => void;
}

export function ReleaseLand({ what3words, onSuccess }: ReleaseLandProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    writeContract, 
    isPending: isSubmitting, 
    isSuccess: isSubmitted, 
    data: txHash, 
    error: writeError 
  } = useWriteContract();
  
  // Wait for transaction receipt
  const { 
    isLoading: isConfirmingTx, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash: txHash
  });
  
  // Call onSuccess when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);
  
  const handleRelease = async () => {
    setError(null);
    setIsConfirming(true);
    
    try {
      writeContract({
        address: LAND_MARKET_ADDRESS as `0x${string}`,
        abi: LAND_MARKET_ABI,
        functionName: 'releaseLand',
        args: [what3words],
      });
    } catch (err) {
      console.error('Error releasing land:', err);
      setError(err instanceof Error ? err.message : 'Failed to release land');
      setIsConfirming(false);
    }
  };
  
  // Handle write contract errors
  useEffect(() => {
    if (writeError && !error) {
      setError(writeError instanceof Error ? writeError.message : 'Transaction failed');
      setIsConfirming(false);
    }
  }, [writeError, error]);
  
  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {isConfirmed ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            Land successfully released!
          </p>
        </div>
      ) : isConfirming ? (
        <div className="mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-700 text-sm">
                {isSubmitting ? 'Confirm in your wallet...' : 
                 isSubmitted ? 'Waiting for confirmation...' : 
                 'Processing...'}
              </p>
            </div>
          </div>
          
          {txHash && (
            <div className="mt-2 text-center">
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                View on Etherscan
              </a>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleRelease}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
        >
          Release Land
        </button>
      )}
    </div>
  );
}
