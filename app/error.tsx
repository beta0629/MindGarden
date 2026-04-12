'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('app/error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#9b6546' }}>
        일시적으로 페이지를 불러오지 못했습니다
      </h1>
      <p style={{ color: '#b58974', marginBottom: '1.5rem', maxWidth: '28rem', lineHeight: 1.6 }}>
        로컬 DB/API 연결이 안 되어도 홈은 떠야 합니다. 계속되면 터미널에서{' '}
        <code style={{ fontSize: '0.9em' }}>rm -rf .next</code> 후{' '}
        <code style={{ fontSize: '0.9em' }}>npm run dev</code>을 다시 실행해 보세요.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: '0.65rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
