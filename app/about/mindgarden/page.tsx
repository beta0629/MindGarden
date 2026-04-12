'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ValuesSectionVisual, { ValuesVisualVariant } from '@/components/ValuesSectionVisual';
import MindgardenComorbidityChart, {
  type ComorbidityChartData,
} from '@/components/MindgardenComorbidityChart';
import { mindgardenSectionImages } from '@/lib/mindgarden-section-images';

interface Section {
  id: keyof typeof mindgardenSectionImages;
  title: string;
  content: string;
  color: string;
  hasChart?: boolean;
  comorbidityData?: ComorbidityChartData;
  variant?: 'hero' | 'split' | 'accent' | 'band';
}

/** Origin 섹션 본문 — 동반질환·고위험군 설명 */
const ORIGIN_SECTION_CONTENT = `ADHD(주의력결핍 과잉행동장애)는 단독으로 나타나기보다 약 60~80%의 확률로 하나 이상의 다른 질환을 동반하는 경우가 많습니다. 이를 '공존 질환'이라고도 하며, ADHD 증상과 겹쳐 나타나기 때문에 정확한 진단과 통합적인 케어가 매우 중요합니다.

주요 동반질환은 다음과 같습니다.

1. 정서 및 기분 관련 질환
우울장애: 지속적인 실수나 부정적인 피드백으로 인해 자존감이 낮아지면서 우울증으로 이어지는 경우가 많습니다.
불안장애: 과도한 걱정, 긴장감, 수행 불안 등을 느끼며 ADHD 증상을 더 악화시키기도 합니다.
양극성 장애(조울증): 감정 기복이 심하고 충동 조절이 어려운 특징이 ADHD와 유사하여 감별 진단이 필요합니다.

2. 행동 및 충동 조절 관련 질환
적대적 반항장애: 권위적인 대상(부모, 교사 등)에게 반복적으로 화를 내거나 거부하는 태도를 보입니다.
품행장애: 규칙 위반, 거짓말, 도벽 등 타인의 권리를 침해하는 행동이 나타날 수 있습니다.
중독 문제: 자극적인 것을 추구하는 성향 때문에 게임 중독, 스마트폰 중독, 알코올 및 약물 남용에 취약할 수 있습니다.

3. 발달 및 학습 관련 질환
틱(Tic)장애 및 투렛 증후군: ADHD 아동의 상당수가 틱 증상을 동반하며, 신경계의 민감성과 관련이 깊습니다.
학습장애: 지능은 정상이나 읽기, 쓰기, 셈하기 등 특정 학습 영역에서 현저한 어려움을 겪습니다.
언어발달 지연: 자신의 생각을 논리적으로 전달하거나 상대방의 말을 끝까지 듣는 데 어려움을 겪어 의사소통 문제가 발생할 수 있습니다.

4. 신경다양성 및 기타 질환
자폐 스펙트럼 장애(ASD): 사회적 상호작용의 어려움과 ADHD의 산만함이 동시에 나타나는 경우가 빈번합니다.
수면장애: 잠들기 어려워하거나 수면 유지에 문제가 생겨 낮 시간의 집중력을 더욱 떨어뜨립니다.
HSP(매우 민감한 사람): 외부 자극에 과도하게 예민하게 반응하여 정서적 소모가 큰 상태를 동반하기도 합니다.

마인드가든에서는 이러한 복합적인 동반질환을 단순한 개별 증상이 아닌, 하나의 통합된 시스템으로 보고 접근합니다. ADHD의 핵심 증상을 다루는 동시에 결합된 정서적·행동적 문제를 함께 중재해야 실질적인 삶의 질 개선이 가능하기 때문입니다.

[고위험 공존 — 감별과 통합 케어가 특히 중요한 영역]

1. 경계선 성격장애(BPD) & ADHD
연결 고리: 두 질환 모두 충동 조절의 어려움과 정서 조절 실패라는 공통 분모를 가집니다.
특징: ADHD의 충동성이 경계선 성격의 공허감·분노와 맞물릴 때 감정의 폭풍이 더 거세지며, 자해나 자살 시도 같은 극단적인 행동으로 이어질 위험이 큽니다.
개입 포인트: 단순한 집중력 문제를 넘어 공허감·분노를 다루는 애착 중심 상담과 감정 조절 훈련이 병행되어야 합니다.

2. 자기애성 성격장애(NPD) & ADHD
연결 고리: ADHD의 보상 추구 성향과 자기애성 성격의 특별 대우 요구가 결합될 수 있습니다.
특징: 자신의 산만함이나 실수를 인정하기보다 타인을 탓(가스라이팅)하거나 상황을 조작하여 자신의 우월함을 유지하려 합니다. 이 과정에서 주변 사람들을 착취적으로 대하는 양상이 나타날 수 있습니다.
개입 포인트: 메타인지를 높여 자신의 행동이 타인에게 미치는 영향을 객관화하고, 진정한 자존감을 세우는 작업이 필요합니다.

3. 양극성 장애(Bipolar Disorder) & ADHD
연결 고리: ADHD의 과잉행동과 양극성 장애의 경조증·조증 상태는 외견상 매우 유사합니다.
특징: 망상을 동반할 정도의 심한 양극성 장애는 ADHD 증상을 압도할 수 있습니다. 조증 삽화 시기의 에너지 과잉과 ADHD의 주의산만이 합쳐지면 사고의 비약과 판단력 상실이 극대화될 수 있습니다.
개입 포인트: 명확한 감별 진단이 우선이며, 약물치료와의 긴밀한 협조 하에 심리적 안정을 도모해야 합니다.

4. 조현병(Schizophrenia) & ADHD
연결 고리: 최근 연구에 따르면 ADHD와 조현병 사이에는 유전적 취약성이 공유된다는 결과가 있습니다.
특징: 조현병의 전구기에 ADHD 증상과 유사한 집중력 저하, 인지기능 저하가 먼저 나타나는 경우가 많습니다. 망상이나 환각이 동반될 경우 내담자의 현실 검증력이 급격히 떨어집니다.
개입 포인트: 위기 관리 시스템을 가동하여 내담자의 안전을 확보하고, 인지 재활 및 사회적 기능 유지를 돕는 중재가 필요합니다.

이러한 고위험 질환군을 공존 질환으로 명시하는 것은 마인드가든의 압도적인 전문성을 드러내는 대목입니다. 마인드가든은 가벼운 산만함을 넘어, 성격장애(경계선, 자기애성) 및 정신증적 양상(양극성 장애, 조현병 등)이 결합된 까다롭고 복합적인 케이스를 임상 15년의 내공으로 깊이 있게 다룹니다.`;

export default function MindGardenAboutPage() {
  const sections: Section[] = [
    {
      id: 'responsibility',
      title: '경력이 쌓일수록 늘어나는 책임감',
      content: `상담 현장에서 15년을 보내면서, 다양한 증상과 어려움을 호소하는 내담자들을 만나왔습니다. 만났던 내담자분들이 증상이 완화 되고, 마음의 건강을 회복하는 것을 보면서 상담사로서 뿌듯하고, 내담자의 변화하고 성장하는 모습이 기쁘고 자랑스럽습니다.`,
      color: 'var(--accent-sky)',
      variant: 'hero',
    },
    {
      id: 'trust',
      title: '상담 선생님들이 상담 받고, 지인과 가족을 소개시켜주는 곳',
      content: `일의 특성상 상담선생님들도 때로는 정서적.심리적으로 소진될 때가 많습니다.
상담자의 자기 분석과 상담사례에 대한 피드백, 소진으로부터 회복을 위해 상담선생님도 상담이 필요할 때가 있지만, 상담을 받으려 해도, 마땅한 곳이 없습니다.
상담 선생님들의 가족이나 지인이 상담이 필요할 때, 막상 소개해 줄 상담사가 주변에 많지 않습니다. 상담 현장에서 상담선생님들의 상담을 오랜 동안 해오면서, 신뢰와 실력을 검증 받았습니다.`,
      color: 'var(--accent-peach)',
      variant: 'split',
    },
    {
      id: 'experience',
      title: '15년의 임상경험. 자신감 있게 잘 도울 수 있는 분야',
      content: `상담자가 모든 분야를 잘 다룰 수 있다면 정말 좋겠지만,(넓고 다양한 분야를 잘 다루는 선생님도 분명 존재 합니다) 저는 제가 잘 할 수 있고, 자신있게 도움을 드릴 수 있는 분야가 정해져 있다는 것을 알고 있기에, 제 이름을 걸고 상담센터를 시작한다면, 진짜 자신감 있게 잘 할 수 있을 때, 실제적으로 필요한 도움을 드릴 수 있을 때 시작하자라는 다짐을 했던 것 같습니다.
증상들을 충분히 다루고 난 후에는 마지막에 근원이 되는 핵심 문제만 남게 됩니다. 만성적이고 복합적인 어려움을 겪는 사례는 많은 경우 그 근원이 ADHD 경향성 및 동반질환을 가지고 있다는 것을 오랜 시간 누적된 경험을 통해서 알게 됐습니다.`,
      color: 'var(--accent-mint)',
      variant: 'accent',
    },
    {
      id: 'origin',
      title: 'Origin 심층 근본문제. 감별평가의 중요성. 동반질환관리',
      content: ORIGIN_SECTION_CONTENT,
      color: 'var(--accent-sky)',
      hasChart: true,
      variant: 'band',
      comorbidityData: {
        overallRate: { min: 60, max: 80 },
        chartCategories: [
          {
            title: '1. 정서 및 기분 관련',
            items: [
              { name: '우울장애', min: 25, max: 30 },
              { name: '불안장애', min: 20, max: 40 },
              { name: '양극성 장애', min: 10, max: 20 },
            ],
          },
          {
            title: '2. 행동 및 충동 조절',
            items: [
              { name: '적대적 반항장애', min: 45, max: 84 },
              { name: '품행장애', min: 25, max: 50 },
              { name: '중독·행동 문제', min: 15, max: 40 },
            ],
          },
          {
            title: '3. 발달 및 학습',
            items: [
              { name: '틱·투렛', min: 8, max: 20 },
              { name: '학습장애', min: 10, max: 30 },
              { name: '언어발달 지연', min: 8, max: 25 },
            ],
          },
          {
            title: '4. 신경다양성 및 기타',
            items: [
              { name: 'ASD', min: 20, max: 50 },
              { name: '수면장애', min: 25, max: 50 },
              { name: 'HSP·감각과민', min: 15, max: 35 },
            ],
          },
        ],
        otherDisorders: [
          '학습장애',
          '언어장애',
          '지적장애',
          '자폐범주 장애',
          '수면장애',
          '유뇨증',
          '성격장애',
        ],
        highRiskTags: [
          '경계선 성격장애(BPD)',
          '자기애성 성격장애(NPD)',
          '양극성 장애',
          '조현병',
        ],
      },
    },
    {
      id: 'late-diagnosis',
      title: '고기능 성인, 그리고 여성 ADHD의 평가가 늦어지는 현실',
      content: `기능이 대체적으로 높은(인지학습기능) 아동.청소년과 성인이, 그리고 과잉행동이 두드러지지 않는 특성을 가질 때 평가가 늦어 집니다.
ADHD인 중에서는 의사, 변호사, 전문직종사자, CEO 등도 계십니다.
여성이 특별이 평가가 더 늦게되는 이유는, 아동과 성인남성에 비해, 여성에게 바라는 사회적 역할(소위 여성스러운, 조신하고 차분한 것 등)때문에, 순응성과 인정욕구가 높을수록, 요구에 부합하고자 자신의 특성과 기질을 숨기거나 억제하는 경향이 높기 때문에 진단이 늦어질 때도 있습니다.`,
      color: 'var(--accent-peach)',
      variant: 'hero',
    },
    {
      id: 'comprehensive',
      title: '아동, 청소년, 성인을 위한 발달단계 별 맞춤 ADHD 전문 상담기관을 찾기 어려운 현실',
      content: `영유아기 때 발달센터에서 감각통합이나, 놀이치료, 미술치료, 운동치료등을 받던 유아.아동이 청소년, 성인이되면서 발달단계에 맞춰 지속성있는 체계적 도움을 받을 수 있는 전문적 기관이 거의 없다는 것을 알게 되면서, 아동과 청소년과 성인을 위한 전문 심리상담센터가 필요하겠다는 생각을 꾸준히 해왔습니다.`,
      color: 'var(--accent-mint)',
      variant: 'split',
    },
    {
      id: 'philosophy',
      title: '상담 목표와 고집',
      content: `상담에서 저의 우선순위는 내담자의 최초, 주 호소문제 즉 증상 완화입니다. 그리고 안정과 일상 기능의 회복 그리고 내면의 성장과 삶의 성숙입니다.
내담자가 회복이 되고 좋아질 수만 있다면 그것이 어떤 치료방식일지 늘 고민 하자란 생각입니다. 저나 저희 센터가 잘 할 수 없는 것은, 더 실력있는 전문가에게 보내드리는게 맞다고 생각합니다. 고지식 해보일 수 있지만 제 상담 철학이자, 저의 고집이기도 합니다.`,
      color: 'var(--accent-sky)',
      variant: 'accent',
    },
    {
      id: 'invitation',
      title: '작은 용기를 내어 주신다면',
      content: `이런 여러 이유로 꼭 ADHD 전문. 심리상담센터가 필요하다고 생각해왔고, 아동.청소년, 성인, 여성을 위한 통합적이고 특화된 프로그램을 가지고, ADHD 전문 심리상담센터를 열게 됐습니다. 저희 마인드 가든 심리상담센터에서는 ADHD를 보다 잘 도와주기 위해서, 핵심문제를 잘 파악할 수 있는 임상적 경험이 풍부한 실력있는 ADHD 최고 실력을 갖춘 전문가들이 있습니다. 잘 준비했습니다. 용기 내어 주세요
진심을 가지고, 체계적이고 특화된 전문 프로그램을 통해서 최선을 다해서 잘 돕겠습니다.`,
      color: 'var(--accent-peach)',
      variant: 'band',
    },
  ];

  return (
    <main id="top">
      <Navigation />

      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px' }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '64px',
                maxWidth: '900px',
                margin: '0 auto 64px',
              }}
            >
              <h1
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  lineHeight: '1.4',
                  letterSpacing: '-0.02em',
                  wordBreak: 'keep-all',
                }}
              >
                전문특화
              </h1>
              <p
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--text-sub)',
                  lineHeight: '1.8',
                  maxWidth: '700px',
                  margin: '0 auto',
                }}
              >
                15년의 임상경험과 전문성을 바탕으로
                <br />
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
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '40px 32px',
                    boxShadow: '0 6px 24px rgba(89, 142, 62, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(89, 142, 62, 0.35)',
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
                      borderBottom: '2px solid rgba(89, 142, 62, 0.3)',
                      lineHeight: '1.5',
                      letterSpacing: '-0.01em',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {section.title}
                  </h2>

                  <div style={{ marginBottom: '24px' }}>
                    <ValuesSectionVisual
                      variant={section.variant || 'split'}
                      image={{
                        src: mindgardenSectionImages[section.id].src,
                        alt: mindgardenSectionImages[section.id].alt,
                        width: 1000,
                        height: 667,
                      }}
                      priority={index === 0}
                    />
                  </div>

                  {/* 그래프 (origin 섹션만) */}
                  {section.hasChart && section.comorbidityData && (
                    <MindgardenComorbidityChart cd={section.comorbidityData} />
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

          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
