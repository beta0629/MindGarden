'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import ProgramLNB from '@/components/ProgramLNB';

const testImages = {
  hero: {
    src: '/assets/images/programs/adhd-testing.png',
    alt: '심리검사',
    width: 1200,
    height: 800,
  },
  split: {
    src: '/assets/images/programs/adhd-testing.png',
    alt: '심리검사',
    width: 800,
    height: 1000,
  },
};

export default function TestPage() {
  return (
    <main id="top">
      <Navigation />
      <ProgramLNB />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section values-page" style={{ paddingTop: '120px' }}>
            <h1 className="section-title" style={{
              marginBottom: '32px',
              textAlign: 'center',
              fontSize: '2.25rem',
              fontWeight: '700',
              lineHeight: '1.5',
              letterSpacing: '-0.02em',
              maxWidth: '800px',
              margin: '0 auto 32px',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              color: 'var(--text-main)'
            }}>
              <span style={{ display: 'block', marginBottom: '8px' }}>정확한 진단을 위한</span>
              <span style={{ display: 'block' }}>종합 심리검사</span>
            </h1>
            
            <div style={{
              textAlign: 'center',
              fontSize: '1.375rem',
              fontWeight: '500',
              color: 'var(--text-main)',
              marginBottom: '64px',
              fontStyle: 'italic',
              lineHeight: '1.7',
              maxWidth: '700px',
              margin: '0 auto 64px',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              padding: '0 20px'
            }}>
              <span style={{ display: 'block', marginBottom: '8px' }}>"객관적이고 신뢰할 수 있는</span>
              <span style={{ display: 'block' }}>평가가 치료의 시작입니다"</span>
            </div>

            {/* Hero Image */}
            <div
              className="values-intro-hero-wrap"
              style={{ maxWidth: '1000px', margin: '0 auto 60px', padding: '0 20px' }}
            >
              <ValuesSectionVisual
                variant="hero"
                image={testImages.hero}
                priority
              />
            </div>

            {/* Split Section */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 400px', fontSize: '1.125rem', lineHeight: '2', color: 'var(--text-sub)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
                  다면적 평가 시스템
                </h2>
                <p style={{ marginBottom: '24px' }}>
                  ADHD 진단은 단일 검사로 이루어지지 않습니다. 지능검사, 주의력검사, 정서 및 성격검사, 부모/교사 평가 척도 등을 종합하여 다면적으로 평가합니다.
                </p>
                <p>
                  임상심리전문가의 심층적인 면담과 체계적인 검사를 통해 현재의 인지적, 정서적, 행동적 특성을 명확히 파악하고, 이를 바탕으로 가장 효과적인 개입 방향을 설정합니다.
                </p>
              </div>
              <div style={{ flex: '1 1 400px' }}>
                <ValuesSectionVisual
                  variant="split"
                  image={testImages.split}
                />
              </div>
            </div>

            {/* 상담 예약하기 버튼 */}
            <div style={{ marginTop: '80px', textAlign: 'center', marginBottom: '40px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => window.dispatchEvent(new Event('open-consultation-bottom-sheet'))}
                style={{
                  fontSize: '1.125rem',
                  padding: '16px 48px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '600',
                  backgroundColor: 'var(--accent-peach)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 212, 184, 0.4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                상담 예약하기
              </button>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
