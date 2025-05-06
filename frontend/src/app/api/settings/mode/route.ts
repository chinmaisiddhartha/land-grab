import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return the current mode setting
    return NextResponse.json({ 
      mode: process.env.APP_MODE || 'development',
      features: {
        blockchain: process.env.ENABLE_BLOCKCHAIN === 'true',
        what3words: process.env.ENABLE_WHAT3WORDS === 'true'
      },
      useMockService: process.env.USE_MOCK_SERVICE === 'true'
    });
  } catch (error) {
    console.error('Error fetching mode settings:', error);
    return NextResponse.json({ error: 'Failed to fetch mode settings' }, { status: 500 });
  }
}
