'use client';

import { Header } from "@/components/Header";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from "wagmi";
import { LAND_MARKET_ADDRESS, LAND_MARKET_ABI } from "@/config/blockchain";

export default function ClaimPage() {
  // Form state
  const [what3words, setWhat3words] = useState('');
  
  // Wallet state
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  
  // Transaction state
  const { 
    writeContract, 
    isPending: isSubmitting, 
    isSuccess: isSubmitted, 
    data: txHash, 
    error: writeError,
    reset: resetWriteContract
  } = useWriteContract();
  
  // UI state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, submitting, submitted, verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [pollingCount, setPollingCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  
  // Wait for transaction receipt
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({ 
    hash: txHash,
    timeout: 60_000 // 60 seconds timeout
  });
  
  // Fetch demo mode status on component mount
  useEffect(() => {
    const fetchDemoMode = async () => {
      try {
        const response = await fetch('/api/settings/mode');
        if (response.ok) {
          const data = await response.json();
          setIsDemoMode(data.useMockService || false);
        } else {
          console.error('Failed to fetch demo mode:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching demo mode status:', error);
      }
    };

    fetchDemoMode();
  }, []);
  
  // Check if land is claimed
  const checkIfClaimed = useCallback(async () => {
    if (!what3words || !address) return;
    
    try {
      const response = await fetch(`/api/blockchain/land-info/${what3words}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.claimed && data.owner?.toLowerCase() === address?.toLowerCase()) {
          setStatus('success');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking land status:', error);
      return false;
    }
  }, [what3words, address]);
  
  // Poll for land claim status
  useEffect(() => {
    if (status !== 'verifying' || !what3words) return;
    
    const MAX_POLLS = 20; // Maximum number of polling attempts
    const POLL_INTERVAL = 3000; // 3 seconds
    
    if (pollingCount >= MAX_POLLS) {
      setStatus('error');
      setErrorMessage('Verification timed out. Please check your transaction on Etherscan.');
      return;
    }
    
    const pollTimer = setTimeout(async () => {
      const isClaimed = await checkIfClaimed();
      
      if (!isClaimed) {
        setPollingCount(prev => prev + 1);
      }
    }, POLL_INTERVAL);
    
    return () => clearTimeout(pollTimer);
  }, [status, what3words, pollingCount, checkIfClaimed]);
  
  // Update status based on transaction state
  useEffect(() => {
    if (isSubmitting) {
      setStatus('submitting');
    } else if (isSubmitted && !isConfirmed) {
      setStatus('submitted');
    } else if (isConfirmed) {
      setStatus('verifying');
      setPollingCount(0); // Reset polling count
    }
  }, [isSubmitting, isSubmitted, isConfirmed]);
  
  // Handle transaction errors
  useEffect(() => {
    if (writeError || confirmError) {
      const error = writeError || confirmError;
      console.error('Transaction error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }, [writeError, confirmError]);
  
  // Submit the claim request
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!what3words) {
      setErrorMessage('Please enter a what3words address');
      return;
    }
    
    if (!isConnected) {
      setErrorMessage('Please connect your wallet');
      return;
    }
    
    try {
      writeContract({
        address: LAND_MARKET_ADDRESS as `0x${string}`,
        abi: LAND_MARKET_ABI,
        functionName: 'requestVerification',
        args: [what3words],
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit transaction');
    }
  };
  
  // Reset the form and state
  const resetForm = () => {
    setWhat3words('');
    setStatus('idle');
    setErrorMessage('');
    setPollingCount(0);
    resetWriteContract?.();
  };
  
  // Toggle debug information
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Claim Land</h2>
            <button 
              onClick={toggleDebug}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
          
          {/* Debug information */}
          {showDebug && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
              <p>Chain ID: {chainId}</p>
              <p>Address: {address || 'Not connected'}</p>
              <p>Balance: {balance?.formatted} {balance?.symbol}</p>
              <p>Contract: {LAND_MARKET_ADDRESS || 'Not set'}</p>
              <p>Status: {status}</p>
              <p>Demo Mode: {isDemoMode ? 'Yes' : 'No'}</p>
              <p>Polling Count: {pollingCount}</p>
              {txHash && <p>TX Hash: {txHash}</p>}
            </div>
          )}
          
          {isDemoMode && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-700 text-sm">
                <strong>Demo Mode Active:</strong> Location verification is bypassed. 
                Any what3words address can be claimed without being physically present.
              </p>
            </div>
          )}
          
          {!isConnected ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">Please connect your wallet to claim land</p>
              <div className="flex justify-center">
                {/* The ConnectButton component will be rendered by the Header */}
              </div>
            </div>
          ) : (
            <>
              {status === 'success' ? (
                <div className="text-center py-4">
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700">
                      <strong>Success!</strong> Your land at <span className="font-mono">{what3words}</span> has been claimed.
                    </p>
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <a 
                      href="/my-lands"
                      className="inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                    >
                      View My Lands
                    </a>
                    <button
                      onClick={resetForm}
                      className="inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
                    >
                      Claim Another Land
                    </button>
                  </div>
                </div>
              ) : status === 'error' ? (
                <div className="text-center py-4">
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">
                      <strong>Error:</strong> {errorMessage || 'Something went wrong during verification.'}
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">what3words Address</label>
                    <input
                      type="text"
                      value={what3words}
                      onChange={(e) => setWhat3words(e.target.value)}
                      placeholder="e.g. filled.count.soap"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      disabled={status !== 'idle'}
                    />
                    {errorMessage && !['submitting', 'submitted', 'verifying'].includes(status) && (
                      <p className="mt-1 text-red-500 text-sm">{errorMessage}</p>
                    )}
                  </div>
                  
                  {status === 'idle' && (
                    <button
                      type="submit"
                      disabled={!what3words || !isConnected}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Claim Land
                    </button>
                  )}
                  
                  {status === 'submitting' && (
                    <div className="text-center py-4">
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-blue-700">
                            <strong>Submitting Transaction...</strong> Please confirm in your wallet.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {status === 'submitted' && (
                    <div className="text-center py-4">
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-blue-700">
                            <strong>Transaction Submitted!</strong> Waiting for confirmation...
                          </p>
                        </div>
                      </div>
                      {txHash && (
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View on Etherscan
                        </a>
                      )}
                    </div>
                  )}
                  {status === 'verifying' && (
                    <div className="text-center py-4">
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-blue-700">
                            <strong>Verifying Location...</strong> This may take a few moments.
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        Attempt {pollingCount + 1} of 20
                      </div>
                      {txHash && (
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View on Etherscan
                        </a>
                      )}
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
