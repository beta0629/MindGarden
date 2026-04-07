'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import { adhdPageImages } from '@/lib/adhd-page-images';

export default function AdhdProgramPage() {
  return (
    <main id="top">
      <Navigation />
      
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
              overflowWrap: 'break-word'
            }}>
              <span style={{ display: 'block', marginBottom: '8px' }}>'마인드 가든'</span>
              <span style={{ display: 'block' }}>ADHD 전문 및 동반질환 프로그램</span>
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
              <span style={{ display: 'block', marginBottom: '8px' }}>'ADHD와 동반질환에 대한 깊은 이해로</span>
              <span style={{ display: 'block' }}>맞춤형 회복과 성장을 돕습니다'</span>
            </div>

            {/* V-hero */}
            <div
              className="values-intro-hero-wrap"
              style={{ maxWidth: '900px', margin: '0 auto 40px', padding: '0 20px' }}
            >
              <ValuesSectionVisual
                variant="hero"
                image={adhdPageImages.hero}
                priority
              />
            </div>

            <div style={{
              maxWidth: '900px',
              margin: '0 auto 80px',
              fontSize: '1.125rem',
              lineHeight: '2',
              color: 'var(--text-sub)',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '24px' }}>
                아동·청소년부터 성인에 이르기까지, 발달 단계에 맞춘 체계적이고 특화된 ADHD 전문 상담을 제공합니다.
              </p>
              <p>
                단순히 증상을 다루는 것을 넘어, 핵심 문제를 정확히 파악하고 동반질환을 함께 다루어 내담자의 삶이 안정적으로 유지되도록 돕겠습니다.
              </p>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {/* 1. 전문성 */}
                <div className="value-section-card" style={{
                  background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 32px',
                  boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 212, 184, 0.35)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid rgba(255, 212, 184, 0.3)'
                  }}>
                    전문성(임상 경험과 감별 평가)
                  </h3>
                  <div className="values-card__split">
                    <div
                      className="values-card__prose"
                      style={{
                        fontSize: '1.0625rem',
                        lineHeight: '2',
                        color: 'var(--text-sub)',
                      }}
                    >
                      <p style={{ marginBottom: '16px' }}>
                        15년 이상의 임상 경험을 바탕으로 ADHD 경향성 및 동반질환의 근원적인 핵심 문제를 정확히 파악합니다.
                      </p>
                      <p style={{ marginBottom: '16px' }}>
                        우울, 불안, 틱장애, 강박 등 다양한 동반질환에 대한 높은 이해도를 바탕으로, 감별 평가를 통해 조기 개입과 맞춤형 상담 계획을 수립합니다.
                      </p>
                      <p>
                        검증된 자격과 풍부한 사례를 갖춘 전문가들이 내담자의 특성을 깊이 이해하고 실제적인 도움을 제공합니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="split" image={adhdPageImages.professionalism} />
                  </div>
                </div>

                {/* 2. 인류애 */}
                <div className="value-section-card" style={{
                  background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 32px',
                  boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 212, 184, 0.35)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid rgba(255, 212, 184, 0.3)'
                  }}>
                    인류애(따뜻한 지지와 수용)
                  </h3>
                  <div className="values-card__human">
                    <div
                      className="values-card__prose"
                      style={{
                        fontSize: '1.0625rem',
                        lineHeight: '2',
                        color: 'var(--text-sub)',
                      }}
                    >
                      <p style={{ marginBottom: '16px' }}>
                        ADHD로 인해 겪는 일상에서의 좌절감, 자존감 하락, 관계의 어려움을 깊이 공감하고 따뜻하게 수용합니다.
                      </p>
                      <p>
                        평가가 늦어지기 쉬운 고기능 성인이나 여성 ADHD 내담자들이 겪는 남모를 고충을 이해하며, 안전하고 편안한 환경에서 자신을 온전히 드러낼 수 있도록 돕겠습니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="accent" image={adhdPageImages.humanity} />
                  </div>
                </div>

                {/* 3. 회복과 성장 */}
                <div className="value-section-card" style={{
                  background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 32px',
                  boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 212, 184, 0.35)',
                  transition: 'all 0.3s ease'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid rgba(255, 212, 184, 0.3)'
                  }}>
                    회복과 성장(기능 회복과 독립)
                  </h3>
                  <div
                    className="values-card__prose"
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: '2',
                      color: 'var(--text-sub)',
                      marginBottom: '24px',
                    }}
                  >
                    <p style={{ marginBottom: '16px' }}>
                      우선적으로 증상을 완화하고 일상의 기능을 회복하는 것을 목표로 합니다. 나아가 내담자 내면의 자원을 발견하고 강점을 찾아 건강한 독립을 이루도록 조력합니다.
                    </p>
                    <p>
                      자신만의 고유한 특성을 수용하고, 적응적인 방식으로 삶을 새롭게 디자인해 나갈 수 있도록 끝까지 함께하겠습니다.
                    </p>
                  </div>
                  <ValuesSectionVisual variant="band" image={adhdPageImages.recovery} />
                </div>
              </div>
              
              {/* 상담 예약하기 버튼 */}
              <div style={{ marginTop: '80px', textAlign: 'center' }}>
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
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
