'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import ProgramLNB from '@/components/ProgramLNB';
import { programPageContent } from '@/lib/program-pages-content';

const symptomsImages = {
  hero: {
    src: '/assets/images/programs/adhd-symptoms.png',
    alt: '증상',
    width: 1200,
    height: 800,
  },
  accent: {
    src: '/assets/images/programs/adhd-symptoms.png',
    alt: '증상',
    width: 600,
    height: 600,
  },
};

const copy = programPageContent.symptoms;

export default function SymptomsPage() {
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
                image={symptomsImages.hero}
                priority
              />
            </div>

            {/* Accent Section */}
            <div style={{ maxWidth: '900px', margin: '0 auto 80px', padding: '0 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
                <ValuesSectionVisual
                  variant="accent"
                  image={symptomsImages.accent}
                />
              </div>
              <div style={{ fontSize: '1.125rem', lineHeight: '2', color: 'var(--text-sub)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
                  표면적 증상 이면의 진짜 문제
                </h2>
                <p style={{ marginBottom: '24px' }}>
                  주의력 결핍, 과잉행동, 충동성이라는 핵심 증상 외에도 감정 조절의 어려움, 대인관계 갈등, 학업 및 업무 수행 저하 등 다양한 영역에서 어려움을 겪을 수 있습니다.
                </p>
                <p>
                  우울, 불안, 수면 장애 등의 동반 질환이 흔하게 나타나며, 이로 인해 자존감이 저하되고 일상생활의 질이 떨어지는 악순환을 경험하기도 합니다.
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
