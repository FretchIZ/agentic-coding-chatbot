'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Confirming email...');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const type = hash.get('type');
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (type === 'signup' && accessToken) {
      const user = { id: '', email: '', user_metadata: {} };
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        user.id = payload.sub;
        user.email = payload.email || '';
      } catch {}
      const session = { access_token: accessToken, refresh_token: refreshToken || '', user };
      try { localStorage.setItem('sb_session', JSON.stringify(session)); } catch {}
      setMsg('Email confirmed! Redirecting...');
      router.push('/chat');
    } else {
      setMsg('Invalid confirmation link');
      setTimeout(() => router.push('/sign-in'), 2000);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
