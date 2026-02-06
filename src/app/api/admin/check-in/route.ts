import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  // Firebase has been removed. This endpoint will be re-implemented using Supabase.
  return NextResponse.json(
    {
      ok: false,
      error: 'Check-in API temporarily disabled (migrating from Firebase to Supabase).',
    },
    { status: 503 }
  );
}
