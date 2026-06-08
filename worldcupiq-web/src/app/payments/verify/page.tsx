'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

type Status = 'verifying' | 'success' | 'failed';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [status, setStatus] = useState<Status>('verifying');
  const [plan, setPlan] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? searchParams.get('transaction_id');
    if (!reference) {
      setStatus('failed');
      return;
    }
    api
      .get(`/payments/verify/${reference}`)
      .then((res) => {
        if (res.data.success) {
          setPlan(res.data.plan ?? '');
          setStatus('success');
          // refresh user data
          api.get('/users/me').then((r) => setUser(r.data.user ?? r.data)).catch(() => {});
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));
  }, [searchParams, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-14 w-14 animate-spin text-primary" />
              <div>
                <p className="text-lg font-semibold">Verifying payment…</p>
                <p className="text-sm text-muted-foreground mt-1">This will only take a moment.</p>
              </div>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-14 w-14 text-primary" />
              <div>
                <p className="text-xl font-bold">Payment successful!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome to {plan === 'tournament_pass' ? 'Tournament Pass' : 'Premium'}. Your account has been upgraded.
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard')} className="mt-2 w-full">
                Go to dashboard
              </Button>
            </>
          )}
          {status === 'failed' && (
            <>
              <XCircle className="h-14 w-14 text-destructive" />
              <div>
                <p className="text-xl font-bold">Payment failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Something went wrong. You have not been charged. Please try again or contact support.
                </p>
              </div>
              <div className="flex gap-3 mt-2 w-full">
                <Button variant="outline" onClick={() => router.push('/upgrade')} className="flex-1">
                  Try again
                </Button>
                <Button onClick={() => router.push('/dashboard')} className="flex-1">
                  Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
