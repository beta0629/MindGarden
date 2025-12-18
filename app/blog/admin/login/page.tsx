'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function BlogLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/blog/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/blog/admin');
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px', maxWidth: '500px', margin: '0 auto' }}>
            <h1 className="section-title" style={{ marginBottom: '24px', textAlign: 'center' }}>
              블로그 관리자 로그인
            </h1>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {error && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: 'var(--radius-sm)',
                  color: '#c33'
                }}>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="관리자 비밀번호를 입력하세요"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-main)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: 'var(--accent-sky)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

