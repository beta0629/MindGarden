'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>리다이렉트 중...</p>
    </div>
  );
}
