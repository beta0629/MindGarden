import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ValuesPage() {
  const values = [
    {
      title: '전문성과 신뢰',
      description: '임상경험이 풍부한 검증된 전문가들이 ADHD 특성을 깊이 이해하고, 과학적 근거 기반의 상담과 치료를 제공합니다.',
      icon: '🎯',
    },
    {
      title: '따뜻하고 안전한 환경',
      description: '편안하고 안전한 공간에서 편견 없이 존중받으며, 당신의 속도에 맞춰 함께 걷는 것을 약속합니다.',
      icon: '🌱',
    },
    {
      title: '개인 맞춤형 접근',
      description: '모든 사람은 고유한 특성을 가지고 있습니다. 표준화된 해결책이 아닌, 당신만의 방식에 맞춘 맞춤형 프로그램을 제공합니다.',
      icon: '✨',
    },
    {
      title: '지속 가능한 변화',
      description: '일시적인 해결이 아닌, 일상에서 지속 가능한 실천 방법과 루틴을 함께 만들어가며 근본적인 변화를 추구합니다.',
      icon: '🌳',
    },
    {
      title: '존중과 배려',
      description: '모든 상담은 존중과 배려를 바탕으로 진행됩니다. 당신의 선택과 결정을 존중하며, 함께 성장하는 파트너가 되겠습니다.',
      icon: '🤝',
    },
    {
      title: '함께 성장',
      description: '마인드 가든은 단순히 상담을 제공하는 곳이 아니라, 당신의 성장과 변화를 함께 만들어가는 동반자입니다.',
      icon: '💚',
    },
  ];

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px' }}>
            <h1 className="section-title" style={{ marginBottom: '24px' }}>마인드 가든의 가치관</h1>
            <p className="section-desc" style={{ marginBottom: '64px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
              마인드 가든은 ADHD 전문 심리상담센터로서, 모든 상담과 치료의 근본에 우리의 핵심 가치가 있습니다. 
              이 가치들이 우리가 하는 모든 일의 기준이 됩니다.
            </p>

            <div className="values-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
              marginTop: '48px'
            }}>
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="value-card"
                >
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '24px',
                    textAlign: 'center'
                  }}>
                    {value.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    color: 'var(--text-main)',
                    textAlign: 'center'
                  }}>
                    {value.title}
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-sub)',
                    textAlign: 'center'
                  }}>
                    {value.description}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '80px',
              padding: '48px',
              background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '16px',
                color: 'var(--text-main)'
              }}>
                함께 만들어가는 변화
              </h2>
              <p style={{
                fontSize: '1.125rem',
                lineHeight: '1.8',
                color: 'var(--text-main)',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                마인드 가든은 당신의 성장과 변화를 진심으로 응원합니다. 
                우리는 단순히 상담을 제공하는 곳이 아니라, 당신의 인생 여정에 함께하는 동반자입니다. 
                함께 걸어가며 더 나은 내일을 만들어갑니다.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

