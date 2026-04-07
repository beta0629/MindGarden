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
                
                {/* 1. 대상 (Target) - split */}
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
                    대상 (Target)
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
                        유아기부터 아동, 청소년, 그리고 성인에 이르기까지 전 연령대를 포괄하는 맞춤형 접근을 제공합니다.
                      </p>
                      <p>
                        각 발달 단계마다 다르게 나타나는 특성을 세심하게 고려하여, 내담자의 생애주기에 가장 적합한 개입 방식을 설계합니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="split" image={adhdPageImages.target} />
                  </div>
                </div>

                {/* 2. 증상 (Symptoms) - accent */}
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
                    증상 (Symptoms)
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
                        주의력 결핍, 과잉행동, 충동성 등 생애주기별로 다르게 발현되는 핵심 증상을 면밀히 분석합니다.
                      </p>
                      <p>
                        단순한 표면적 증상뿐만 아니라, 우울, 불안, 틱장애, 강박 등 흔히 동반되는 질환들을 함께 파악하여 통합적인 관점에서 문제를 바라봅니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="accent" image={adhdPageImages.symptoms} />
                  </div>
                </div>

                {/* 3. 치료 (Treatment) - band */}
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
                    치료 (Treatment)
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
                      <strong>전문성:</strong> 약물 치료와 비약물적 개입(인지행동치료, 실행기능 훈련 등)을 아우르는 통합 치료를 지향합니다.
                    </p>
                    <p style={{ marginBottom: '16px' }}>
                      <strong>인류애:</strong> 내담자가 겪는 일상의 좌절을 따뜻하게 수용하고 지지하며, 안전한 환경에서 자신을 드러낼 수 있도록 돕습니다.
                    </p>
                    <p>
                      <strong>회복과 성장:</strong> 증상의 완화를 넘어, 내면의 강점을 발견하고 주도적인 삶을 살아갈 수 있도록 조력합니다.
                    </p>
                  </div>
                  <ValuesSectionVisual variant="band" image={adhdPageImages.treatment} />
                </div>

                {/* 4. 심리검사 (Testing) - split */}
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
                    심리검사 (Testing)
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
                        정확한 진단과 개입 계획 수립을 위해 체계적인 평가를 실시합니다.
                      </p>
                      <p>
                        종합심리검사(Full Battery)를 통해 전반적인 인지, 정서, 성격 특성을 파악하고, 객관적인 주의력 검사(CAT 등)를 병행하여 현재의 상태를 명확히 진단합니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="split" image={adhdPageImages.testing} />
                  </div>
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
