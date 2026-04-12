'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import ProgramLNB from '@/components/ProgramLNB';
import { programPageContent } from '@/lib/program-pages-content';

const targetImages = {
  hero: {
    src: '/assets/images/programs/adhd-target.png',
    alt: '대상',
    width: 1200,
    height: 800,
  },
  split: {
    src: '/assets/images/programs/adhd-target.png',
    alt: '대상',
    width: 800,
    height: 1000,
  },
};

const copy = programPageContent.target;

export default function TargetPage() {
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
              <span style={{ display: 'block', marginBottom: '8px' }}>{copy.heroTitle[0]}</span>
              <span style={{ display: 'block' }}>{copy.heroTitle[1]}</span>
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
              <span style={{ display: 'block', marginBottom: '8px' }}>{copy.heroLead[0]}</span>
              <span style={{ display: 'block' }}>{copy.heroLead[1]}</span>
            </div>

            {/* Hero Image */}
            <div
              className="values-intro-hero-wrap"
              style={{ maxWidth: '1000px', margin: '0 auto 60px', padding: '0 20px' }}
            >
              <ValuesSectionVisual
                variant="hero"
                image={targetImages.hero}
                priority
              />
            </div>

            {/* Split Section */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 20px', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
              <div style={{ flex: '1 1 400px' }}>
                <ValuesSectionVisual
                  variant="split"
                  image={targetImages.split}
                />
              </div>
              <div style={{ flex: '1 1 400px', fontSize: '1.125rem', lineHeight: '2', color: 'var(--text-sub)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
                  아동부터 성인까지
                </h2>
                <p style={{ marginBottom: '24px' }}>
                  ADHD는 아동기에만 국한된 문제가 아닙니다. 청소년기를 거쳐 성인기까지 지속될 수 있으며, 각 시기마다 나타나는 양상과 필요한 지원이 다릅니다.
                </p>
                <p>
                  마인드가든은 유아동, 학령기 아동, 청소년, 성인 등 각 발달 단계에 맞는 특화된 평가와 맞춤형 개입을 제공하여 전 생애주기에 걸친 건강한 적응을 돕습니다.
                </p>
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
                  boxShadow: '0 4px 12px rgba(168, 213, 186, 0.4)',
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
