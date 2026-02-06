import { NextRequest, NextResponse } from 'next/server';

const disabled = () =>
  NextResponse.json(
    {
      ok: false,
      error:
        'Donations API temporarily disabled (migrating from Firebase to Supabase).',
    },
    { status: 503 }
  );

export async function POST(_request: NextRequest) {
  return disabled();
}

export async function GET() {
  return disabled();
}

export async function PATCH(_request: NextRequest) {
  return disabled();
}

export async function DELETE(_request: NextRequest) {
  return disabled();
}
