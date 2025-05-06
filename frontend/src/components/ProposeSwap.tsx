'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LAND_SWAP_ADDRESS, LAND_SWAP_ABI } from '@/config/blockchain';

interface ProposeSwapProps {
  what3words: string;
  onSuccess?: () => void;
}

export function ProposeSwap({ what3words, onSuccess }: ProposeSwapProps) {
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverWhat3Words, setReceiverWhat3Words] = useState('');
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
  
  const handleProposeSwap = async () => {
    setError(null);
    
    if (!receiverAddress || !receiverWhat3Words) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate receiver address
    if (!receiverAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address');
      return;
    }
    
    // Validate what3words format
    if (!receiverWhat3Words.match(/^[a-z]+\.[a-z]+\.[a-z]+$/)) {
      setError('Invalid what3words format (should be word.word.word)');
      return;
    }
    
    setIsConfirming(true);
    
    try {
      writeContract({
        address: LAND_SWAP_ADDRESS as `0x${string}`,
        abi: LAND_SWAP_ABI,
        functionName: 'proposeSwap',
        args: [what3words, receiverAddress, receiverWhat3Words],
      });
    } catch (err) {
      console.error('Error proposing swap:', err);
      setError(err instanceof Error ? err.message : 'Failed to propose swap');
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {isConfirmed ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">
            Swap proposal successfully submitted!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="receiverAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Receiver's Ethereum Address
            </label>
            <input
              id="receiverAddress"
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isConfirming}
            />
          </div>
          
          <div>
            <label htmlFor="receiverWhat3Words" className="block text-sm font-medium text-gray-700 mb-1">
              Receiver's what3words Address
            </label>
            <input
              id="receiverWhat3Words"
              type="text"
              value={receiverWhat3Words}
              onChange={(e) => setReceiverWhat3Words(e.target.value)}
              placeholder="word.word.word"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isConfirming}
            />
          </div>
          
          <button
            onClick={handleProposeSwap}
            disabled={isConfirming || isSubmitting || isConfirmingTx}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isConfirmingTx ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Propose Swap'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
