import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    // Get the address from the route parameters - await params to fix the error
    const { address } = await params;
    
    // Forward the request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/blockchain/user-lands/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user lands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user lands' },
      { status: 500 }
    );
  }
}
