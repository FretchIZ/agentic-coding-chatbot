'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { persistSessionFromHash } from '@/lib/supabase';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Confirming email...');

  useEffect(() => {
    const type = new URLSearchParams(window.location.hash.substring(1)).get('type');
    if (type === 'signup') {
      const user = persistSessionFromHash();
      if (user) {
        setMsg('Email confirmed! Redirecting...');
        router.push('/chat');
        return;
      }
    }
    setMsg('Invalid confirmation link');
    setTimeout(() => router.push('/sign-in'), 2000);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
