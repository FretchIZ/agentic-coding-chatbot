'use client';

import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState('Completing sign-in...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const provider = params.get('provider') || 'google.com';
    let accessToken = hash.get('access_token');

    if (accessToken) {
      window.opener?.postMessage({ type: 'oauth', accessToken, provider }, window.location.origin);
      window.close();
      return;
    }

    const code = params.get('code');
    if (code && provider === 'github.com') {
      setMsg('Exchanging GitHub code...');
      fetch('/api/auth/github/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) {
            window.opener?.postMessage({ type: 'oauth', accessToken: data.access_token, provider }, window.location.origin);
            window.close();
          } else {
            setMsg('Failed to get GitHub token');
          }
        })
        .catch(() => setMsg('Error exchanging GitHub code'));
      return;
    }

    window.location.href = '/sign-in';
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
