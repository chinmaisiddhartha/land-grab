'use client';

import { useState, useEffect } from 'react';

export function DemoModeIndicator() {
  const [isDemoMode, setIsDemoMode] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the current mode from the backend
    const fetchDemoMode = async () => {
      try {
        const response = await fetch('/api/settings/mode');
        if (response.ok) {
          const data = await response.json();
          setIsDemoMode(data.useMockService);
        }
      } catch (error) {
        console.error('Error fetching demo mode status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemoMode();
  }, []);

  if (isLoading) return null;

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      isDemoMode 
        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
        : 'bg-green-100 text-green-800 border border-green-300'
    }`}>
      {isDemoMode ? 'Demo Mode' : 'Live Mode'}
    </div>
  );
}
