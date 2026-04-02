import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import { valuesPageImages } from '@/lib/values-page-images';

export default function ValuesPage() {
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
              <span style={{ display: 'block' }}>심리상담센터의 가치와 목표</span>
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
              <span style={{ display: 'block', marginBottom: '8px' }}>'마음이 건강하고 안정되게</span>
              <span style={{ display: 'block' }}>자라나도록 돌보고 가꾸다'</span>
            </div>

            {/* V-hero: 이탤릭 명제 아래 · 두 문단 위. LCP 후보 → priority */}
            <div
              className="values-intro-hero-wrap"
              style={{ maxWidth: '900px', margin: '0 auto 40px', padding: '0 20px' }}
            >
              <ValuesSectionVisual
                variant="hero"
                image={valuesPageImages.hero}
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
                시들고 메마른 가뭄과 같은 삶이, 5월의 어느 푸른 찬란한 봄날처럼, 자신만의 색과 모양으로 인생의 꽃을 다시 꽃 피울 수 있도록, 머물러 회복하고 성장하는 곳
              </p>
              <p>
                사람마다 꽃을 피우고 열매를 맺는 시기는 각각 다르기에, 그 시간과 과정을 귀히 여기고, 소중하고 정성스럽게 가꾸고 돌보며, 누구나의 마음의 봄이 오도록 함께 하겠습니다
              </p>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <h2 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '48px',
                textAlign: 'center',
                lineHeight: '1.5',
                letterSpacing: '-0.01em',
                maxWidth: '700px',
                margin: '0 auto 48px',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
                padding: '0 20px'
              }}>
                <span style={{ display: 'block' }}>'마인드 가든'</span>
                <span style={{ display: 'block' }}>심리상담센터는</span>
              </h2>

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
                    전문성(상담사로서의 윤리와 책임감)
                  </h3>
                  {/* V-pro: 데스크톱 좌글·우 이미지, 모바일 이미지 상단(order) · 4:3 */}
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
                        내담자의 호소내용에 귀 기울이고, 최우선 적으로 증상을 완화 하는데 노력 하겠습니다.
                        전문성에 입각하여 실제적인 도움을 드리겠습니다. 관련학과전공자(대학원), 주요 학회 등 검증된 자격을 갖춘, 다양하고 오랜 경험이 축적된 상담사례를 가진, 전문적인 상담사가 함께 하겠습니다.
                      </p>
                      <p style={{ marginBottom: '16px' }}>
                        상담사 개인은 내담자 특성을 잘 이해하고, 1:1 맞춤형 상담 계획을 진행해 나가기 위해, 전문가로서 지속적으로 훈련하고 임상을 쌓아 나아가며, 전문성을 유지, 발전하기 위해서 노력할 것을 다짐 합니다. 상담사로서의 직업적 윤리의식을 철저 하게 준수하기 위해 상담사가 속해 있는 자격기관(학회)에서 윤리교육을 지속적으로 받기 위해 노력하겠습니다.
                      </p>
                      <p>
                        내담자를 보다 잘 돕기 위해서, 상담자 스스로 정서적 회복을 위해 필요한 충분한 휴식시간을 가지며 소진되지 않도록 노력하겠습니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="split" image={valuesPageImages.professionalism} />
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
                    인류애(인간적이고 따뜻한 마음과 존중)
                  </h3>
                  {/* V-human: 데스크톱 우측 악센트, 모바일 본문 다음 · 1:1 */}
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
                        삶을 살아가다가 가장 지치고 힘들 때 지푸라기를 잡는 심정으로 문을 두드린 분들께, 상담을 통해서 진짜 쉼을 경험하고, 각자의 고단함을 내려놓을 수 있도록, 안전하고 따듯한, 진정성 있는 배려를 잃지 않도록 노력겠습니다. 한결 같은 마음으로 버텨주는 든든하고 믿음스러운 나무와 같은 벗이 되겠습니다.
                      </p>
                      <p>
                        내담자를 가르침을 받는 대상으로서가 아닌, 인간 본연의 힘이 있다는 것을 믿고, 그 안에 자원이 있음을 발견하고, 강점을 찾아, 내적인 힘을 다시 회복할 수 있도록 조력하겠습니다. 그리고 한 사람으로서 성장하고 성숙해가는 과정을 정성스럽게 돕겠습니다.
                      </p>
                    </div>
                    <ValuesSectionVisual variant="accent" image={valuesPageImages.humanity} />
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
                    회복과 성장. 건강한 독립
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
                      '마인드 가든'의 모든 상담사들은 내담자의 마음을 깊이 들여다보고, 각자의 고유한 모습을 발견하고, 스스로의 자신을 수용하고 통합 해 나갈 수 있도록 돕겠습니다.
                    </p>
                    <p style={{ marginBottom: '16px' }}>
                      적응적이고 건강한 방식으로 삶을 디자인하고, 건강한 방향으로 자리를 잡아가며, 사회에 구성원으로서 건강한 인격체로 독립적인 사람으로 성장할 수 있도록 돕겠습니다.
                    </p>
                    <p>
                      삶의 방향성을 회복하고, 내담자가 미래를 다시 디자인 할 수 있도록 최선을 다하겠습니다.
                    </p>
                  </div>
                  {/* V-growth: 카드 하단 풀폭 밴드 · 2:1~16:9 */}
                  <ValuesSectionVisual variant="band" image={valuesPageImages.growth} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
