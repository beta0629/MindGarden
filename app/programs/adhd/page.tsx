'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import ProgramLNB from '@/components/ProgramLNB';
import { adhdPageImages } from '@/lib/adhd-page-images';
import { checklistLegalNotice } from '@/lib/checklist-legal-notice';

export default function AdhdProgramPage() {
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
              <span style={{ display: 'block', marginBottom: '8px' }}>마인드가든</span>
              <span style={{ display: 'block' }}>ADHD 통합 케어 솔루션</span>
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
              <span style={{ display: 'block', marginBottom: '8px' }}>"한 사람의 온전한 성장을 위해</span>
              <span style={{ display: 'block' }}>증상 너머의 삶을 바라봅니다"</span>
            </div>

            {/* Hero Image */}
            <div
              className="values-intro-hero-wrap"
              style={{ maxWidth: '1000px', margin: '0 auto 60px', padding: '0 20px' }}
            >
              <ValuesSectionVisual
                variant="hero"
                image={adhdPageImages.hero}
                priority
              />
            </div>

            {/* Philosophy Section */}
            <div style={{
              maxWidth: '900px',
              margin: '0 auto 80px',
              fontSize: '1.125rem',
              lineHeight: '2',
              color: 'var(--text-sub)',
              textAlign: 'center',
              padding: '0 20px'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '24px'
              }}>
                김선희 대표원장의 철학이 담긴 통합 접근
              </h2>
              <p style={{ marginBottom: '24px' }}>
                ADHD는 단순한 주의력의 문제를 넘어, 일상생활과 대인관계 전반에 영향을 미치는 복합적인 어려움입니다. 마인드가든은 증상 완화에만 머물지 않고, 내담자가 자신의 잠재력을 발휘하며 건강한 삶을 살아갈 수 있도록 돕습니다.
              </p>
              <p>
                놀이치료, 미술치료, 가족상담, 그리고 트라우마 상담까지. 각 분야의 전문성을 바탕으로 내담자의 연령과 환경, 그리고 동반되는 심리적 어려움까지 세심하게 고려한 맞춤형 통합 케어를 제공합니다.
              </p>
            </div>

            <div
              style={{
                maxWidth: '640px',
                margin: '0 auto 56px',
                padding: '24px 28px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(168, 213, 186, 0.15)',
                border: '1px solid rgba(168, 213, 186, 0.35)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '12px',
                  wordBreak: 'keep-all',
                }}
              >
                스스로 증상 패턴을 살펴보고 싶다면
              </p>
              <div
                className="screening-disclaimer"
                role="note"
                style={{
                  marginTop: 0,
                  marginBottom: '20px',
                  textAlign: 'left',
                  padding: '16px 18px',
                }}
              >
                {checklistLegalNotice.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      color: 'var(--text-sub)',
                      marginBottom: i === checklistLegalNotice.paragraphs.length - 1 ? 0 : '10px',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
              <Link
                href="/screening"
                className="adhd-self-check-btn adhd-self-check-btn-primary"
                style={{ width: '100%', maxWidth: '280px' }}
              >
                체크리스트 허브로 가기
              </Link>
            </div>

            {/* 4-Step Modules (2x2 Grid) */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '40px',
                textAlign: 'center'
              }}>
                마인드가든 4단계 통합 모듈
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                marginBottom: '80px'
              }}>
                
                {/* Module 1 */}
                <div className="adhd-module-card" style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <Image 
                      src={adhdPageImages.mod1.src} 
                      alt={adhdPageImages.mod1.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '32px' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(255, 212, 184, 0.3)',
                      color: 'var(--accent-peach)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '16px'
                    }}>
                      STEP 1
                    </div>
                    <h3 style={{
                      fontSize: '1.375rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '16px'
                    }}>
                      심층 평가
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.8',
                      color: 'var(--text-sub)'
                    }}>
                      종합심리검사와 주의력 검사를 통해 현재의 인지, 정서, 행동 특성을 다각도로 분석합니다. 표면적인 증상뿐만 아니라 기저의 원인을 정확히 파악하여 개입의 방향을 설정합니다.
                    </p>
                  </div>
                </div>

                {/* Module 2 */}
                <div className="adhd-module-card" style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <Image 
                      src={adhdPageImages.mod2.src} 
                      alt={adhdPageImages.mod2.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '32px' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(255, 212, 184, 0.3)',
                      color: 'var(--accent-peach)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '16px'
                    }}>
                      STEP 2
                    </div>
                    <h3 style={{
                      fontSize: '1.375rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '16px'
                    }}>
                      맞춤 핵심 상담
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.8',
                      color: 'var(--text-sub)'
                    }}>
                      연령과 발달 단계에 맞춰 놀이치료, 미술치료, 인지행동치료 등을 적용합니다. 주의 집중력 향상과 충동 조절, 실행 기능 강화를 위한 실질적인 훈련을 병행합니다.
                    </p>
                  </div>
                </div>

                {/* Module 3 */}
                <div className="adhd-module-card" style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <Image 
                      src={adhdPageImages.mod3.src} 
                      alt={adhdPageImages.mod3.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '32px' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(255, 212, 184, 0.3)',
                      color: 'var(--accent-peach)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '16px'
                    }}>
                      STEP 3
                    </div>
                    <h3 style={{
                      fontSize: '1.375rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '16px'
                    }}>
                      동반질환 케어
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.8',
                      color: 'var(--text-sub)'
                    }}>
                      ADHD와 흔히 동반되는 우울, 불안, 틱장애, 강박, 그리고 과거의 상처로 인한 트라우마까지. 복합적인 심리적 어려움을 통합적으로 다루어 내면의 안정을 되찾습니다.
                    </p>
                  </div>
                </div>

                {/* Module 4 */}
                <div className="adhd-module-card" style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <Image 
                      src={adhdPageImages.mod4.src} 
                      alt={adhdPageImages.mod4.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '32px' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: 'rgba(255, 212, 184, 0.3)',
                      color: 'var(--accent-peach)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '16px'
                    }}>
                      STEP 4
                    </div>
                    <h3 style={{
                      fontSize: '1.375rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '16px'
                    }}>
                      환경 및 가족 지원
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      lineHeight: '1.8',
                      color: 'var(--text-sub)'
                    }}>
                      상담실 밖의 삶이 변화할 수 있도록 가족상담과 부모 교육을 제공합니다. 내담자를 둘러싼 환경이 지지적인 체계로 기능하도록 돕고, 일상에서의 적응력을 높입니다.
                    </p>
                  </div>
                </div>

              </div>
              
              {/* CSS for Hover Effects and Grid */}
              <style jsx>{`
                .adhd-module-card:hover {
                  transform: translateY(-8px);
                  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
                }
                @media (min-width: 768px) {
                  .adhd-module-card {
                    height: 100%;
                  }
                }
              `}</style>

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
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
