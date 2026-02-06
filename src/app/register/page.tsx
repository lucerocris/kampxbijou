'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2 } from 'lucide-react';

type Step1Data = {
  name: string;
  email: string;
  paymentMethod: 'gcash' | 'bank' | '';
};

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

type UploadProofResponse =
  | { ok: true; key: string; url: string }
  | { ok: false; error: string };

function getUploadErrorMessage(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'error' in data) {
    const maybe = (data as { error?: unknown }).error;
    if (typeof maybe === 'string') return maybe;
  }
  return 'Failed to upload payment proof';
}

async function uploadPaymentProof(file: File): Promise<{ key: string; url: string }> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/api/registrations/upload-proof', {
    method: 'POST',
    body: fd,
  });

  const data: unknown = await res.json();
  if (!res.ok) {
    throw new Error(getUploadErrorMessage(data));
  }

  const parsed = data as UploadProofResponse;
  if (!parsed || parsed.ok !== true) {
    throw new Error(getUploadErrorMessage(data));
  }

  return { key: parsed.key, url: parsed.url };
}

export default function RegistrationForm() {
  const [step, setStep] = useState<1 | 2>(1);

  const [step1, setStep1] = useState<Step1Data>({
    name: '',
    email: '',
    paymentMethod: '',
  });

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');

  // Prefer object URLs for previews (lighter than base64), but keep fallback for older flows.
  const [paymentProofObjectUrl, setPaymentProofObjectUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (paymentProofObjectUrl) URL.revokeObjectURL(paymentProofObjectUrl);
    };
  }, [paymentProofObjectUrl]);

  const qrSrc = useMemo(() => {
    if (step1.paymentMethod === 'gcash') return '/gcash_qr.jpg';
    if (step1.paymentMethod === 'bank') return '/bank_qr.jpg';
    return '';
  }, [step1.paymentMethod]);

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, paymentMethod } = step1;
    if (!name || !email || !paymentMethod) {
      setError('Please complete all required fields before continuing.');
      return;
    }

    setStep(2);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, paymentMethod } = step1;
    if (!name || !email || !paymentMethod) {
      setError('Missing registration details. Please go back and try again.');
      setStep(1);
      return;
    }

    if (!paymentProofFile) {
      setError('Please upload your proof of payment.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1) Upload proof to S3 (Spaces)
      const { url: paymentProofUrl } = await uploadPaymentProof(paymentProofFile);

      // 2) Insert registration into Supabase, storing only the S3 URL
      const createRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, paymentMethod, paymentProofUrl }),
      });

      const createData = await createRes.json();
      if (!createRes.ok)
        throw new Error(createData?.error || 'Failed to submit registration');

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Registration received
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Your payment proof has been uploaded. Please wait for admin
              verification.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-semibold">
            Registration
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {step === 1
              ? 'Enter your details to proceed to payment.'
              : 'Scan the QR and upload your proof of payment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 ? (
            <form onSubmit={handlePayNow} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={step1.name}
                  onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@example.com"
                  value={step1.email}
                  onChange={(e) =>
                    setStep1({ ...step1, email: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={step1.paymentMethod}
                  onValueChange={(value) =>
                    setStep1({
                      ...step1,
                      paymentMethod: value as Step1Data['paymentMethod'],
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Choose payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Pay Now
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div className="rounded-lg border bg-background p-3">
                <div className="text-sm font-medium mb-2">Scan this QR</div>
                {qrSrc ? (
                  <div className="flex items-center justify-center">
                    <Image
                      src={qrSrc}
                      alt="Payment QR"
                      width={280}
                      height={280}
                      className="rounded-md"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No QR available. Please go back and choose a payment method.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="paymentProof">Payment Proof (image or PDF) *</Label>
                  {paymentProofFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        setPaymentProofFile(null);
                        setPaymentProofPreview('');
                        if (paymentProofObjectUrl) URL.revokeObjectURL(paymentProofObjectUrl);
                        setPaymentProofObjectUrl('');
                        const input = document.getElementById(
                          'paymentProof'
                        ) as HTMLInputElement | null;
                        if (input) input.value = '';
                      }}
                      disabled={isSubmitting}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>

                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;

                    setPaymentProofFile(file);
                    setPaymentProofPreview('');

                    if (paymentProofObjectUrl) URL.revokeObjectURL(paymentProofObjectUrl);
                    setPaymentProofObjectUrl('');

                    if (file) {
                      // Best effort: try object URL preview first.
                      try {
                        setPaymentProofObjectUrl(URL.createObjectURL(file));
                      } catch {
                        // ignore
                      }

                      // Keep current base64 preview as a fallback (also works for images).
                      if (file.type.startsWith('image/')) {
                        try {
                          const preview = await fileToDataUrl(file);
                          setPaymentProofPreview(preview);
                        } catch {
                          // ignore preview errors
                        }
                      }
                    }
                  }}
                  required
                  disabled={isSubmitting}
                />

                {paymentProofFile ? (
                  <div className="rounded-lg border overflow-hidden">
                    {paymentProofFile.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={paymentProofObjectUrl || paymentProofPreview}
                        alt="Payment proof preview"
                        className="w-full max-h-[320px] object-contain bg-muted"
                      />
                    ) : paymentProofFile.type === 'application/pdf' ? (
                      <iframe
                        title="Payment proof preview"
                        src={paymentProofObjectUrl}
                        className="w-full h-[320px] bg-muted"
                      />
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">
                        Preview not available for this file type.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Upload your screenshot/receipt here.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
