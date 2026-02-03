'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function MindGardenAboutPage() {
  const sections = [
    {
      id: 'responsibility',
      title: '경력이 쌓일수록 늘어나는 책임감',
      content: `상담 현장에서 15년을 보내면서, 다양한 증상과 어려움을 호소하는 내담자들을 만나왔습니다. 만났던 내담자분들이 증상이 완화 되고, 마음의 건강을 회복하는 것을 보면서 상담사로서 뿌듯하고, 내담자의 변화하고 성장하는 모습이 기쁘고 자랑스럽습니다.`,
      icon: '🌱',
      color: 'var(--accent-sky)',
    },
    {
      id: 'trust',
      title: '상담 선생님들이 상담 받고, 지인과 가족을 소개시켜주는 곳',
      content: `일의 특성상 상담선생님들도 때로는 정서적.심리적으로 소진될 때가 많습니다.
상담자의 자기 분석과 상담사례에 대한 피드백, 소진으로부터 회복을 위해 상담선생님도 상담이 필요할 때가 있지만, 상담을 받으려 해도, 마땅한 곳이 없습니다.
상담 선생님들의 가족이나 지인이 상담이 필요할 때, 막상 소개해 줄 상담사가 주변에 많지 않습니다. 상담 현장에서 상담선생님들의 상담을 오랜 동안 해오면서, 신뢰와 실력을 검증 받았습니다.`,
      icon: '🤝',
      color: 'var(--accent-peach)',
    },
    {
      id: 'experience',
      title: '15년의 임상경험. 자신감 있게 잘 도울 수 있는 분야',
      content: `상담자가 모든 분야를 잘 다룰 수 있다면 정말 좋겠지만,(넓고 다양한 분야를 잘 다루는 선생님도 분명 존재 합니다) 저는 제가 잘 할 수 있고, 자신있게 도움을 드릴 수 있는 분야가 정해져 있다는 것을 알고 있기에, 제 이름을 걸고 상담센터를 시작한다면, 진짜 자신감 있게 잘 할 수 있을 때, 실제적으로 필요한 도움을 드릴 수 있을 때 시작하자라는 다짐을 했던 것 같습니다.
증상들을 충분히 다루고 난 후에는 마지막에 근원이 되는 핵심 문제만 남게 됩니다. 만성적이고 복합적인 어려움을 겪는 사례는 많은 경우 그 근원이 ADHD 경향성 및 동반질환을 가지고 있다는 것을 오랜 시간 누적된 경험을 통해서 알게 됐습니다.`,
      icon: '⭐',
      color: 'var(--accent-mint)',
    },
    {
      id: 'origin',
      title: 'Origin 심층 근본문제. 감별평가의 중요성. 동반질환관리',
      content: `ADHD 경향성으로 인한 2차문제로 자존감 하락, 가족갈등, 학습문제, 또래 관계 갈등, 과한 걱정.특정버릇 성향, 강박, 사회기술부족, 감정조절의 어려움, 공격성, 충동성, 짜증 등으로 문제의 반복으로 인해, 삶의 질이 전반적으로 낮아지게 됩니다.
안타깝게도 다양한 기관을 다녔지만, 시간이 지나도 개선되지 않거나, 실제적인 도움을 받지 못해서, 방치되는 경우를 보게 됩니다. 증상만 다루다 끝나는 것이 아닌, 핵심문제를 정확히 파악해야 필요한 도움을 받을 수 있습니다. 감별평가가 제대로 될 때 조기개입이 가능해집니다. 평가 이후에도 높은 동반질환의 특성을 이해하고, 동반질환을 함께 다뤄주면 증상이 완화.개선되고 상담 이전보다 삶이 안정적으로 유지되는 것을 보게 됩니다.`,
      icon: '🔍',
      color: 'var(--accent-sky)',
      hasChart: true,
      comorbidityData: {
        overallRate: { min: 67, max: 80 },
        disorders: [
          { name: '적대적 반항장애', min: 45, max: 84 },
          { name: '품행장애', min: 25, max: 50 },
          { name: '우울장애', min: 25, max: 30 },
          { name: '틱장애', min: 8, max: 10 },
          { name: '강박불안장애', min: 15, max: 25 },
          { name: '양극성장애', min: 10, max: 20 },
        ],
        otherDisorders: ['학습장애', '언어장애', '지적장애', '자폐범주 장애', '수면장애', '유뇨증', '성격장애']
      }
    },
    {
      id: 'late-diagnosis',
      title: '고기능 성인, 그리고 여성 ADHD의 평가가 늦어지는 현실',
      content: `기능이 대체적으로 높은(인지학습기능) 아동.청소년과 성인이, 그리고 과잉행동이 두드러지지 않는 특성을 가질 때 평가가 늦어 집니다.
ADHD인 중에서는 의사, 변호사, 전문직종사자, CEO 등도 계십니다.
여성이 특별이 평가가 더 늦게되는 이유는, 아동과 성인남성에 비해, 여성에게 바라는 사회적 역할(소위 여성스러운, 조신하고 차분한 것 등)때문에, 순응성과 인정욕구가 높을수록, 요구에 부합하고자 자신의 특성과 기질을 숨기거나 억제하는 경향이 높기 때문에 진단이 늦어질 때도 있습니다.`,
      icon: '👥',
      color: 'var(--accent-peach)',
    },
    {
      id: 'comprehensive',
      title: '아동, 청소년, 성인을 위한 발달단계 별 맞춤 ADHD 전문 상담기관을 찾기 어려운 현실',
      content: `영유아기 때 발달센터에서 감각통합이나, 놀이치료, 미술치료, 운동치료등을 받던 유아.아동이 청소년, 성인이되면서 발달단계에 맞춰 지속성있는 체계적 도움을 받을 수 있는 전문적 기관이 거의 없다는 것을 알게 되면서, 아동과 청소년과 성인을 위한 전문 심리상담센터가 필요하겠다는 생각을 꾸준히 해왔습니다.`,
      icon: '🌳',
      color: 'var(--accent-mint)',
    },
    {
      id: 'philosophy',
      title: '상담 목표와 고집',
      content: `상담에서 저의 우선순위는 내담자의 최초, 주 호소문제 즉 증상 완화입니다. 그리고 안정과 일상 기능의 회복 그리고 내면의 성장과 삶의 성숙입니다.
내담자가 회복이 되고 좋아질 수만 있다면 그것이 어떤 치료방식일지 늘 고민 하자란 생각입니다. 저나 저희 센터가 잘 할 수 없는 것은, 더 실력있는 전문가에게 보내드리는게 맞다고 생각합니다. 고지식 해보일 수 있지만 제 상담 철학이자, 저의 고집이기도 합니다.`,
      icon: '💎',
      color: 'var(--accent-sky)',
    },
    {
      id: 'invitation',
      title: '작은 용기를 내어 주신다면',
      content: `이런 여러 이유로 꼭 ADHD 전문. 심리상담센터가 필요하다고 생각해왔고, 아동.청소년, 성인, 여성을 위한 통합적이고 특화된 프로그램을 가지고, ADHD 전문 심리상담센터를 열게 됐습니다. 저희 마인드 가든 심리상담센터에서는 ADHD를 보다 잘 도와주기 위해서, 핵심문제를 잘 파악할 수 있는 임상적 경험이 풍부한 실력있는 ADHD 최고 실력을 갖춘 전문가들이 있습니다. 잘 준비했습니다. 용기 내어 주세요
진심을 가지고, 체계적이고 특화된 전문 프로그램을 통해서 최선을 다해서 잘 돕겠습니다.`,
      icon: '🌸',
      color: 'var(--accent-peach)',
    },
  ];

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px' }}>
            {/* 헤더 */}
            <div style={{
              textAlign: 'center',
              marginBottom: '64px',
              maxWidth: '900px',
              margin: '0 auto 64px'
            }}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '24px',
                lineHeight: '1.4',
                letterSpacing: '-0.02em',
                wordBreak: 'keep-all'
              }}>
                최초 ADHD와 동반질환<br />
                전문 심리상담센터
              </h1>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--text-sub)',
                lineHeight: '1.8',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                15년의 임상경험과 전문성을 바탕으로<br />
                ADHD와 동반질환을 함께 다루는 맞춤형 상담을 제공합니다
              </p>
            </div>

            {/* 섹션 목록 */}
            <div style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '48px'
            }}>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="value-section-card"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '40px 32px',
                    boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(255, 212, 184, 0.35)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* 제목 */}
                  <h2 
                    className="about-section-title"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '24px',
                      paddingBottom: '16px',
                      borderBottom: '2px solid rgba(255, 212, 184, 0.3)',
                      lineHeight: '1.5',
                      letterSpacing: '-0.01em',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {section.title}
                  </h2>

                  {/* 그래프 (origin 섹션만) */}
                  {section.hasChart && section.comorbidityData && (
                    <div style={{
                      marginBottom: '32px',
                      padding: '24px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255, 212, 184, 0.2)'
                    }}>
                      {/* 전체 동반질환 비율 */}
                      <div style={{
                        marginBottom: '32px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          color: 'var(--text-sub)',
                          marginBottom: '12px',
                          fontWeight: '600'
                        }}>
                          ADHD 진단 시 동반질환 발생률
                        </div>
                        <div style={{
                          position: 'relative',
                          width: '200px',
                          height: '200px',
                          margin: '0 auto'
                        }}>
                          <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                              cx="100"
                              cy="100"
                              r="80"
                              fill="none"
                              stroke="rgba(255, 212, 184, 0.2)"
                              strokeWidth="20"
                            />
                            <circle
                              cx="100"
                              cy="100"
                              r="80"
                              fill="none"
                              stroke="rgba(255, 212, 184, 0.8)"
                              strokeWidth="20"
                              strokeDasharray={`${(section.comorbidityData.overallRate.max * 2 * Math.PI * 80) / 100} ${2 * Math.PI * 80}`}
                              strokeLinecap="round"
                              style={{ transition: 'all 0.5s ease' }}
                            />
                          </svg>
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                          }}>
                            <div style={{
                              fontSize: '2rem',
                              fontWeight: '700',
                              color: 'var(--accent-peach)',
                              lineHeight: '1.2'
                            }}>
                              {section.comorbidityData.overallRate.min}~{section.comorbidityData.overallRate.max}%
                            </div>
                            <div style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-sub)',
                              marginTop: '4px'
                            }}>
                              동반질환 발생
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 주요 동반질환 막대 그래프 */}
                      <div style={{
                        marginBottom: '24px'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          color: 'var(--text-sub)',
                          marginBottom: '16px',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          주요 동반질환별 발생률
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          {section.comorbidityData.disorders.map((disorder, idx) => {
                            const avgRate = (disorder.min + disorder.max) / 2;
                            const colors = [
                              'rgba(255, 212, 184, 0.8)',
                              'rgba(184, 212, 227, 0.8)',
                              'rgba(212, 240, 232, 0.8)',
                              'rgba(232, 213, 227, 0.8)',
                              'rgba(255, 244, 212, 0.8)',
                              'rgba(255, 212, 184, 0.6)',
                            ];
                            return (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                              }}>
                                <div style={{
                                  flex: '0 0 140px',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-main)',
                                  fontWeight: '500',
                                  wordBreak: 'keep-all'
                                }}>
                                  {disorder.name}
                                </div>
                                <div style={{
                                  flex: '1',
                                  position: 'relative',
                                  height: '28px',
                                  background: 'rgba(255, 212, 184, 0.15)',
                                  borderRadius: '14px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    height: '100%',
                                    width: `${avgRate}%`,
                                    background: `linear-gradient(90deg, ${colors[idx % colors.length]} 0%, ${colors[idx % colors.length].replace('0.8', '0.6')} 100%)`,
                                    borderRadius: '14px',
                                    transition: 'width 0.8s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '8px',
                                    boxShadow: `0 2px 8px ${colors[idx % colors.length].replace('0.8', '0.3')}`
                                  }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      color: 'var(--text-main)',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {disorder.min}~{disorder.max}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 기타 동반질환 */}
                      <div style={{
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(255, 212, 184, 0.2)'
                      }}>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-sub)',
                          marginBottom: '12px',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          기타 동반질환
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          {section.comorbidityData.otherDisorders.map((disorder, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                background: 'rgba(255, 212, 184, 0.15)',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                color: 'var(--text-main)',
                                fontWeight: '500'
                              }}
                            >
                              {disorder}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 내용 */}
                  <div style={{
                    fontSize: '1.0625rem',
                    lineHeight: '2',
                    color: 'var(--text-sub)'
                  }}>
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      paragraph.trim() && (
                        <p key={pIndex} style={{
                          marginBottom: pIndex < section.content.split('\n').filter(p => p.trim()).length - 1 ? '16px' : '0',
                          wordBreak: 'keep-all',
                          overflowWrap: 'break-word'
                        }}>
                          {paragraph.trim()}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 CTA */}
            <div style={{
              marginTop: '80px',
              textAlign: 'center',
              padding: '48px 32px',
              background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--accent-sky)40'
            }}>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '16px'
              }}>
                상담 문의하기
              </h3>
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--text-sub)',
                marginBottom: '32px',
                lineHeight: '1.8'
              }}>
                마인드 가든과 함께 시작하는 회복의 여정
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/#contact"
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: 'var(--accent-sky)',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1.0625rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                  }}
                >
                  상담 예약하기
                </Link>
                <Link
                  href="/"
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    border: '2px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1.0625rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-1)';
                    e.currentTarget.style.borderColor = 'var(--accent-sky)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-soft)';
                  }}
                >
                  홈으로 돌아가기
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
