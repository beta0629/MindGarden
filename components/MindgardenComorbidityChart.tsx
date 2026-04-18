'use client';

export interface ComorbidityChartData {
  overallRate: { min: number; max: number };
  /** 도넛 위 짧은 제목 (예: ADHD와 함께 나타나는 동반질환 비율) */
  donutTitle?: string;
  /** 막대 그룹 상단 제목 */
  barSectionTitle?: string;
  /** 도넛 중앙 아래 보조 문구 */
  centerSubLabel?: string;
  disorders?: Array<{ name: string; min: number; max: number }>;
  chartCategories?: Array<{
    title: string;
    items: Array<{ name: string; min: number; max: number }>;
  }>;
  otherDisorders: string[];
  highRiskTags?: string[];
}

const BAR_COLORS = [
  'rgba(89, 142, 62, 0.85)',
  'rgba(120, 165, 95, 0.85)',
  'rgba(184, 212, 227, 0.9)',
  'rgba(212, 240, 232, 0.9)',
  'rgba(232, 213, 227, 0.9)',
  'rgba(255, 244, 212, 0.95)',
  'rgba(89, 142, 62, 0.65)',
  'rgba(75, 120, 55, 0.85)',
  'rgba(150, 180, 130, 0.85)',
  'rgba(100, 140, 85, 0.85)',
  'rgba(130, 160, 110, 0.85)',
  'rgba(160, 190, 140, 0.85)',
];

export default function MindgardenComorbidityChart({ cd }: { cd: ComorbidityChartData }) {
  const overallMid = (cd.overallRate.min + cd.overallRate.max) / 2;
  const circumference = 2 * Math.PI * 80;
  const donutTitle = cd.donutTitle ?? 'ADHD와 함께 나타나는 동반질환 비율';
  const barSectionTitle = cd.barSectionTitle ?? '주요 동반질환별 발생률';
  const centerSubLabel = cd.centerSubLabel ?? '동반질환 발생';

  return (
    <div
      style={{
        marginBottom: '32px',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(89, 142, 62, 0.2)',
      }}
    >
      <div
        style={{
          marginBottom: '8px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-sub)',
        }}
      >
        문헌·임상 통계 참고 · 발생률은 연구·집단마다 다를 수 있습니다
      </div>

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-sub)',
            marginBottom: '12px',
            fontWeight: '600',
          }}
        >
          {donutTitle}
        </div>
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(89, 142, 62, 0.2)" strokeWidth="20" />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(89, 142, 62, 0.82)"
              strokeWidth="20"
              strokeDasharray={`${(overallMid * circumference) / 100} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'all 0.5s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--accent-cta)',
                lineHeight: '1.2',
              }}
            >
              {cd.overallRate.min}~{cd.overallRate.max}%
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '4px' }}>{centerSubLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-sub)',
            marginBottom: '16px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {barSectionTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {cd.chartCategories
            ? cd.chartCategories.map((cat, ci) => (
                <div key={cat.title}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '10px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid rgba(89, 142, 62, 0.2)',
                    }}
                  >
                    {cat.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cat.items.map((disorder, ii) => {
                      const idx = ci * 4 + ii;
                      const avgRate = (disorder.min + disorder.max) / 2;
                      const c = BAR_COLORS[idx % BAR_COLORS.length];
                      return (
                        <div
                          key={`${cat.title}-${disorder.name}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div
                            style={{
                              flex: '1 1 160px',
                              minWidth: '120px',
                              maxWidth: '220px',
                              fontSize: '0.88rem',
                              color: 'var(--text-main)',
                              fontWeight: '500',
                              wordBreak: 'keep-all',
                            }}
                          >
                            {disorder.name}
                          </div>
                          <div
                            style={{
                              flex: '2 1 200px',
                              position: 'relative',
                              height: '28px',
                              background: 'rgba(89, 142, 62, 0.12)',
                              borderRadius: '14px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${Math.min(100, avgRate)}%`,
                                background: c,
                                borderRadius: '14px',
                                transition: 'width 0.8s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '8px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  color: 'var(--text-main)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {disorder.min}~{disorder.max}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            : (cd.disorders ?? []).map((disorder, idx) => {
                const avgRate = (disorder.min + disorder.max) / 2;
                const c = BAR_COLORS[idx % BAR_COLORS.length];
                return (
                  <div
                    key={disorder.name}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    <div
                      style={{
                        flex: '0 0 140px',
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        fontWeight: '500',
                        wordBreak: 'keep-all',
                      }}
                    >
                      {disorder.name}
                    </div>
                    <div
                      style={{
                        flex: '1',
                        position: 'relative',
                        height: '28px',
                        background: 'rgba(89, 142, 62, 0.15)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${avgRate}%`,
                          background: c,
                          borderRadius: '14px',
                          transition: 'width 0.8s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {disorder.min}~{disorder.max}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {cd.highRiskTags && cd.highRiskTags.length > 0 && (
        <div
          style={{
            paddingTop: '16px',
            marginBottom: '16px',
            borderTop: '1px dashed rgba(89, 142, 62, 0.35)',
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-sub)',
              marginBottom: '12px',
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            감별·통합 케어가 특히 중요한 고위험 공존
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {cd.highRiskTags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: 'rgba(158, 107, 78, 0.18)',
                  border: '1px solid rgba(158, 107, 78, 0.45)',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  color: 'var(--text-main)',
                  fontWeight: '600',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(89, 142, 62, 0.2)' }}>
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-sub)',
            marginBottom: '12px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          기타 동반질환 (예시)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {cd.otherDisorders.map((disorder, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: 'rgba(89, 142, 62, 0.15)',
                borderRadius: '16px',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                fontWeight: '500',
              }}
            >
              {disorder}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
