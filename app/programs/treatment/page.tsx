'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import ProgramLNB from '@/components/ProgramLNB';
import { programPageContent } from '@/lib/program-pages-content';

const treatmentImages = {
  hero: {
    src: '/assets/images/programs/adhd-treatment.png',
    alt: '상담 및 지원',
    width: 1200,
    height: 800,
  },
  band: {
    src: '/assets/images/programs/adhd-treatment.png',
    alt: '상담 및 지원',
    width: 1200,
    height: 400,
  },
};

const copy = programPageContent.treatment;

export default function TreatmentPage() {
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
                image={treatmentImages.hero}
                priority
              />
            </div>

            {/* Band Section */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 20px' }}>
              <div style={{ marginBottom: '60px' }}>
                <ValuesSectionVisual
                  variant="band"
                  image={treatmentImages.band}
                />
              </div>
              <div style={{ maxWidth: '900px', margin: '0 auto', fontSize: '1.125rem', lineHeight: '2', color: 'var(--text-sub)', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
                  개인 맞춤형 상담 계획
                </h2>
                <p style={{ marginBottom: '24px' }}>
                  약물 처방만으로는 해결되지 않는 정서적, 행동적 어려움을 다루기 위해 인지행동치료(CBT), 놀이치료, 미술치료 등 다양한 비약물적 개입을 병행합니다.
                </p>
                <p>
                  실행 기능 향상 훈련, 사회성 기술 훈련, 감정 조절 연습 등을 통해 일상생활에서의 실질적인 적응력을 높이고, 긍정적인 자아상을 형성하도록 돕습니다.
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
