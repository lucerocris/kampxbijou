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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

// --- Types & Helpers ---
type Step1Data = {
  name: string;
  email: string;
  socialAccount: string;
  paymentMethod: 'e-wallet';
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
    | { ok: false, error: string };

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
    socialAccount: '',
    paymentMethod: 'e-wallet',
  });

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
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
    return 'https://lucerocris.sgp1.cdn.digitaloceanspaces.com/Screenshot_20260206_182220.png';
  }, []);

  const isStep1Complete = useMemo(() => {
    return Boolean(step1.name.trim()) && Boolean(step1.email.trim());
  }, [step1.name, step1.email]);

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email } = step1;
    if (!name || !email) {
      setError('Please complete all required fields before continuing.');
      return;
    }

    setStep(2);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, paymentMethod, socialAccount } = step1;
    if (!name || !email) {
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
      const { url: paymentProofUrl } = await uploadPaymentProof(paymentProofFile);

      const createRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          paymentMethod,
          socialAccount: String(socialAccount ?? '').trim() || null,
          paymentProofUrl,
        }),
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

  // --- Theme Styles ---
  const pageBackgroundStyle = {
    backgroundColor: '#f8f5f2',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
  };

  const brandButtonClass = "w-full bg-[#920d25] hover:bg-[#7a0b1f] text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg";

  // --- Success View ---
  if (isSuccess) {
    return (
        <main className="min-h-screen w-full  flex flex-col items-center justify-center p-4" style={pageBackgroundStyle}>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)]" />

          <Card className="w-full max-w-md text-center bg-white/90 backdrop-blur-sm shadow-2xl border-none relative z-10">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#920d25]/10">
                <CheckCircle2 className="h-8 w-8 text-[#920d25]" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Registration Received!
              </CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                Your payment proof has been uploaded. <br/> See you at the workshop!
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
    );
  }

  // --- Form View ---
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center p-6"
      style={pageBackgroundStyle}
    >

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.03)_100%)]" />

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg border-none relative z-30">

        <CardHeader className="pb-2">

          {/* --- NEW HEADER LOGO BLOCK --- */}
          <section className="w-full flex justify-center items-center h-24 relative z-10 ">
            <div className="relative w-[200px]">
              <Image
                  src="/logoHeader.png"
                  alt="Beads and Brew"
                  width={100}
                  height={100}
                  priority
                  className="w-full h-auto object-contain drop-shadow-sm opacity-90 mix-blend-multiply transform"
              />
            </div>
          </section>
          {/* ----------------------------- */}

          <div className="w-full flex justify-center mb-2">
            <p className="uppercase tracking-[0.25em] text-[10px] text-gray-500 font-semibold mb-4">
              Charm Bracelet Workshop
            </p>
          </div>
          <CardTitle className="text-3xl text-center font-display text-[#920d25]">
            {step === 1 ? 'Join the Fun' : 'Secure Your Spot'}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            {step === 1
                ? 'Enter your details below to start.'
                : 'Scan the QR code to complete payment.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {step === 1 ? (
              <form onSubmit={handlePayNow} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                  <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Juan Dela Cruz"
                      value={step1.name}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStep1({ ...step1, name: next });
                        if (error) setError('');
                      }}
                      required
                      disabled={isSubmitting}
                      className="bg-white/50 border-gray-300 focus:border-[#920d25] focus:ring-[#920d25]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialAccount" className="text-gray-700 font-medium">
                    IG / Facebook Account
                  </Label>
                  <Input
                      id="socialAccount"
                      type="text"
                      placeholder="e.g. @yourhandle or facebook.com/you"
                      value={step1.socialAccount}
                      onChange={(e) => setStep1({ ...step1, socialAccount: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-white/50 border-gray-300 focus:border-[#920d25] focus:ring-[#920d25]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input
                      id="email"
                      type="email"
                      placeholder="e.g. juan@example.com"
                      value={step1.email}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStep1({ ...step1, email: next });
                        if (error) setError('');
                      }}
                      required
                      disabled={isSubmitting}
                      className="bg-white/50 border-gray-300 focus:border-[#920d25] focus:ring-[#920d25]/20"
                  />
                </div>

                <div className="pt-2">
                  <Button
                      type="submit"
                      className={brandButtonClass}
                      disabled={isSubmitting || !isStep1Complete}
                  >
                    Next Step
                  </Button>
                </div>
              </form>
          ) : (
              <form onSubmit={handleSubmitProof} className="space-y-5">

                {/* QR Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  {qrSrc ? (
                      <div className="flex items-center justify-center">
                        <div className="relative w-48 h-60 rounded-lg overflow-hidden border border-gray-100">
                          <Image
                              src={qrSrc}
                              alt="Payment QR"
                              fill
                              className="object-fit"
                          />
                        </div>
                      </div>
                  ) : (
                      <div className="text-sm text-center py-8 text-muted-foreground">
                        QR loading...
                      </div>
                  )}
                </div>

                {/* Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="paymentProof" className="text-gray-700 font-medium">Upload Screenshot</Label>
                    {paymentProofFile && (
                        <button
                            type="button"
                            className="text-xs text-red-600 hover:text-red-800 underline"
                            onClick={() => {
                              setPaymentProofFile(null);
                              setPaymentProofPreview('');
                              setPaymentProofObjectUrl('');
                              const input = document.getElementById('paymentProof') as HTMLInputElement;
                              if(input) input.value = '';
                            }}
                        >
                          Remove
                        </button>
                    )}
                  </div>

                  {!paymentProofFile ? (
                      <div className="relative group">
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
                                try { setPaymentProofObjectUrl(URL.createObjectURL(file)); } catch {}
                                if (file.type.startsWith('image/')) {
                                  try {
                                    const preview = await fileToDataUrl(file);
                                    setPaymentProofPreview(preview);
                                  } catch {}
                                }
                              }
                            }}
                            required
                            disabled={isSubmitting}
                            className="cursor-pointer file:cursor-pointer file:text-[#920d25] file:font-semibold file:bg-red-50 file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-full text-gray-600"
                        />
                      </div>
                  ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden relative">
                        {paymentProofFile.type.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={paymentProofObjectUrl || paymentProofPreview}
                                alt="Preview"
                                className="w-full max-h-[200px] object-contain"
                            />
                        ) : (
                            <div className="p-8 text-center text-sm text-gray-500">PDF Selected: {paymentProofFile.name}</div>
                        )}
                      </div>
                  )}
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-3 pt-2">
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="px-4 border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Button type="submit" disabled={isSubmitting} className={brandButtonClass}>
                    {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                    ) : (
                        'Confirm Payment'
                    )}
                  </Button>
                </div>
              </form>
          )}
        </CardContent>
      </Card>

      <footer className="w-full flex justify-center pt-4 pb-2 relative z-20">
        {/* FIX:
          - 'h-12' creates a small, static box in the layout flow.
          - The content above will not move.
        */}
        <div className="relative w-32 md:w-40 h-12 flex items-center justify-center">
          <Image
            src="/kampxbijou.png"
            alt="Kamp x Bijou"
            width={200}
            height={100}
            className="w-full h-auto object-contain opacity-90 mix-blend-multiply transform scale-150 origin-center"
          />
        </div>
      </footer>
    </main>
  );
}

