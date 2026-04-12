'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem' }}>심각한 오류가 발생했습니다</h1>
        <p style={{ color: '#555', marginTop: '0.75rem' }}>{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: '1.25rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
