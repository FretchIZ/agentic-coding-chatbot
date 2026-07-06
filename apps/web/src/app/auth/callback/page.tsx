'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { persistSessionFromHash } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Completing sign-in...');

  useEffect(() => {
    const user = persistSessionFromHash();
    if (user) {
      setMsg('Signed in!');
      router.push('/chat');
    } else {
      const err = new URLSearchParams(window.location.hash.substring(1)).get('error_description');
      setMsg(err || 'Sign-in failed');
      setTimeout(() => router.push('/sign-in'), 2000);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
