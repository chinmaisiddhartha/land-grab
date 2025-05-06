import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { what3words: string } }
) {
  try {
    // Get the what3words from the route parameters - use the params object directly
    const what3words = params.what3words;
    
    // Forward the request to the backend
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/blockchain/land-info/${what3words}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching land info:', error);
    return NextResponse.json({ error: 'Failed to fetch land info' }, { status: 500 });
  }
}
