import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type RegistrationRecord = {
  id: string;
  name: string;
  email: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  verification: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
};

type DbRegistrationRow = {
  id: string;
  name: string;
  email: string;
  payment_method: string;
  payment_proof_url: string | null;
  verification: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

function toApiRecord(row: DbRegistrationRow): RegistrationRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    paymentMethod: row.payment_method,
    paymentProofUrl: row.payment_proof_url ?? undefined,
    verification: row.verification,
    timestamp: row.created_at,
  };
}

type ErrorMeta = {
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

function errorMeta(error: unknown): ErrorMeta {
  const e = error as ErrorMeta | null | undefined;
  return {
    details: e?.details,
    hint: e?.hint,
    code: e?.code,
  };
}

function normalizeEmail(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeName(value: unknown): string {
  return String(value ?? '').trim();
}

function isUniqueEmailViolation(error: unknown): boolean {
  const e = error as { code?: unknown; message?: unknown; details?: unknown } | null | undefined;
  const code = String(e?.code ?? '');
  const message = String(e?.message ?? '');
  const details = String(e?.details ?? '');

  // Postgres unique_violation is 23505; Supabase often preserves this code.
  if (code === '23505') return true;

  // Fallback: match common phrasing/constraint name.
  return (
    message.includes('registration_email_key') ||
    details.includes('registration_email_key') ||
    (message.includes('duplicate key value') && message.includes('email'))
  );
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('registrations')
      .select('id,name,email,payment_method,payment_proof_url,verification,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      const meta = errorMeta(error);
      console.error('Failed to load registrations', {
        message: error.message,
        ...meta,
      });
      return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 });
    }

    return NextResponse.json(
      { registrations: (data ?? []).map((r) => toApiRecord(r as DbRegistrationRow)) },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, paymentMethod, paymentProofUrl } = body ?? {};

    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName || !normalizedEmail || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('registrations')
      .insert({
        name: normalizedName,
        email: normalizedEmail,
        payment_method: String(paymentMethod),
        payment_proof_url: paymentProofUrl ? String(paymentProofUrl) : null,
        verification: 'pending',
      })
      .select('id,name,email,payment_method,payment_proof_url,verification,created_at')
      .single();

    if (error) {
      const meta = errorMeta(error);
      console.error('Failed to create registration', {
        message: error.message,
        ...meta,
      });

      if (isUniqueEmailViolation(error)) {
        return NextResponse.json(
          { error: 'This email is already registered. If you need help, please contact the event organizer.' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, registration: toApiRecord(data as DbRegistrationRow) },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, verification, paymentProofUrl } = body ?? {};

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const update: Partial<DbRegistrationRow> & {
      payment_method?: string;
    } = {};

    if (verification) {
      if (!['pending', 'accepted', 'rejected'].includes(verification)) {
        return NextResponse.json({ error: 'Invalid verification state' }, { status: 400 });
      }
      update.verification = verification;
    }

    if (paymentProofUrl) {
      update.payment_proof_url = String(paymentProofUrl);
    }

    if (!verification && !paymentProofUrl) {
      return NextResponse.json(
        { error: 'Either verification or paymentProofUrl must be provided' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('registrations')
      .update(update)
      .eq('id', String(id))
      .select('id,name,email,payment_method,payment_proof_url,verification,created_at')
      .single();

    if (error) {
      const meta = errorMeta(error);
      console.error('Failed to update registration', {
        message: error.message,
        ...meta,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, registration: toApiRecord(data as DbRegistrationRow) },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from('registrations').delete().eq('id', id);

    if (error) {
      const meta = errorMeta(error);
      console.error('Failed to delete registration', {
        message: error.message,
        ...meta,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}
