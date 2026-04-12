'use client';

const p = {
  fontSize: '1.0625rem',
  lineHeight: 2,
  color: 'var(--text-sub)',
  marginBottom: '16px',
  wordBreak: 'keep-all' as const,
  overflowWrap: 'break-word' as const,
};

const h3 = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: 'var(--text-main)',
  marginTop: '28px',
  marginBottom: '14px',
  lineHeight: 1.45,
  wordBreak: 'keep-all' as const,
};

const ul = {
  margin: '0 0 20px 0',
  paddingLeft: '1.25rem',
  listStyleType: 'disc' as const,
};

const liBlock = {
  fontSize: '1.0625rem',
  lineHeight: 2,
  color: 'var(--text-sub)',
  marginBottom: '10px',
  wordBreak: 'keep-all' as const,
  overflowWrap: 'break-word' as const,
};

const riskBox = {
  marginTop: '32px',
  padding: '20px 20px 4px',
  background: 'rgba(89, 142, 62, 0.06)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid rgba(89, 142, 62, 0.18)',
};

const quote = {
  marginTop: '28px',
  marginBottom: '0',
  padding: '20px 22px',
  background: 'rgba(89, 142, 62, 0.08)',
  borderLeft: '4px solid rgba(89, 142, 62, 0.55)',
  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
  fontSize: '1.05rem',
  lineHeight: 1.85,
  color: 'var(--text-main)',
  fontWeight: 500,
  wordBreak: 'keep-all' as const,
};

/**
 * 전문특화 페이지 `origin` 섹션 — 동반질환·고위험 공존 원고 (구조화 본문)
 */
export default function MindgardenOriginSectionContent() {
  return (
    <div style={{ fontSize: '1.0625rem', lineHeight: 2, color: 'var(--text-sub)' }}>
      <p style={{ ...p, marginTop: 0 }}>
        ADHD(주의력결핍 과잉행동장애)는 단독으로 나타나기보다 약 60~80%의 확률로 하나 이상의 다른 질환을 동반하는 경우가 많습니다. 이를
        &lsquo;공존 질환&rsquo;이라고도 하며, ADHD 증상과 겹쳐 나타나기 때문에 정확한 진단과 통합적인 케어가 매우 중요합니다.
      </p>
      <p style={p}>주요 동반질환은 다음과 같습니다.</p>

      <h3 style={{ ...h3, marginTop: '12px' }}>1. 정서 및 기분 관련 질환</h3>
      <ul style={ul}>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>우울장애</strong> — 지속적인 실수나 부정적인 피드백으로 인해 자존감이 낮아지면서 우울증으로 이어지는 경우가 많습니다.
        </li>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>불안장애</strong> — 과도한 걱정, 긴장감, 수행 불안 등을 느끼며 ADHD 증상을 더 악화시키기도 합니다.
        </li>
        <li style={{ ...liBlock, marginBottom: 0 }}>
          <strong style={{ color: 'var(--text-main)' }}>양극성 장애(조울증)</strong> — 감정 기복이 심하고 충동 조절이 어려운 특징이 ADHD와 유사하여 감별 진단이 필요합니다.
        </li>
      </ul>

      <h3 style={h3}>2. 행동 및 충동 조절 관련 질환</h3>
      <ul style={ul}>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>적대적 반항장애</strong> — 권위적인 대상(부모, 교사 등)에게 반복적으로 화를 내거나 거부하는 태도를 보입니다.
        </li>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>품행장애</strong> — 규칙 위반, 거짓말, 도벽 등 타인의 권리를 침해하는 행동이 나타날 수 있습니다.
        </li>
        <li style={{ ...liBlock, marginBottom: 0 }}>
          <strong style={{ color: 'var(--text-main)' }}>중독 문제</strong> — 자극적인 것을 추구하는 성향 때문에 게임 중독, 스마트폰 중독, 알코올 및 약물 남용에 취약할 수 있습니다.
        </li>
      </ul>

      <h3 style={h3}>3. 발달 및 학습 관련 질환</h3>
      <ul style={ul}>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>틱(Tic)장애 및 투렛 증후군</strong> — ADHD 아동의 상당수가 틱 증상을 동반하며, 신경계의 민감성과 관련이 깊습니다.
        </li>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>학습장애</strong> — 지능은 정상이나 읽기, 쓰기, 셈하기 등 특정 학습 영역에서 현저한 어려움을 겪습니다.
        </li>
        <li style={{ ...liBlock, marginBottom: 0 }}>
          <strong style={{ color: 'var(--text-main)' }}>언어발달 지연</strong> — 자신의 생각을 논리적으로 전달하거나 상대방의 말을 끝까지 듣는 데 어려움을 겪어 의사소통 문제가 발생할 수 있습니다.
        </li>
      </ul>

      <h3 style={h3}>4. 신경다양성 및 기타 질환</h3>
      <ul style={ul}>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>자폐 스펙트럼 장애(ASD)</strong> — 사회적 상호작용의 어려움과 ADHD의 산만함이 동시에 나타나는 경우가 빈번합니다.
        </li>
        <li style={liBlock}>
          <strong style={{ color: 'var(--text-main)' }}>수면장애</strong> — 잠들기 어려워하거나 수면 유지에 문제가 생겨 낮 시간의 집중력을 더욱 떨어뜨립니다.
        </li>
        <li style={{ ...liBlock, marginBottom: 0 }}>
          <strong style={{ color: 'var(--text-main)' }}>HSP(매우 민감한 사람)</strong> — 외부 자극에 과도하게 예민하게 반응하여 정서적 소모가 큰 상태를 동반하기도 합니다.
        </li>
      </ul>

      <p style={p}>
        마인드가든에서는 이러한 복합적인 동반질환을 단순한 개별 증상이 아닌, 하나의 통합된 시스템으로 보고 접근합니다. ADHD의 핵심 증상을 다루는 동시에 결합된 정서적·행동적 문제를 함께 중재해야 실질적인 삶의 질 개선이 가능하기 때문입니다.
      </p>

      <h3 style={{ ...h3, marginTop: '36px' }}>고위험 공존 — 감별과 통합 케어가 특히 중요한 영역</h3>

      <div style={riskBox}>
        <h4 style={{ ...h3, fontSize: '1.05rem', marginTop: 0 }}>1. 경계선 성격장애(BPD) &amp; ADHD</h4>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>연결 고리</strong> — 두 질환 모두{' '}
          <strong>&lsquo;충동 조절의 어려움&rsquo;</strong>과 <strong>&lsquo;정서 조절 실패&rsquo;</strong>라는 공통 분모를 가집니다.
        </p>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>특징</strong> — ADHD의 충동성이 경계선 성격의 유기 불안과 만날 때, 감정의 폭풍이 더 거세지며 자해나 자살 시도 같은 극단적인 행동으로 이어질 위험이 큽니다.
        </p>
        <p style={{ ...p, marginBottom: '20px' }}>
          <strong style={{ color: 'var(--text-main)' }}>개입 포인트</strong> — 단순한 집중력 문제를 넘어, 유기 불안을 다루는 애착 중심 상담과 감정 조절 훈련이 병행되어야 합니다.
        </p>

        <h4 style={{ ...h3, fontSize: '1.05rem', marginTop: '8px' }}>2. 자기애성 성격장애(NPD) &amp; ADHD</h4>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>연결 고리</strong> — ADHD의 <strong>&lsquo;보상 추구 성향&rsquo;</strong>과 자기애성 성격의{' '}
          <strong>&lsquo;특별 대우 요구&rsquo;</strong>가 결합될 수 있습니다.
        </p>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>특징</strong> — 자신의 산만함이나 실수를 인정하기보다 타인을 탓(가스라이팅)하거나 상황을 조작하여 자신의 우월함을 유지하려 합니다. 이 과정에서 주변 사람들을 착취적으로 대하는 양상이 나타납니다.
        </p>
        <p style={{ ...p, marginBottom: '20px' }}>
          <strong style={{ color: 'var(--text-main)' }}>개입 포인트</strong> — 메타인지를 높여 자신의 행동이 타인에게 미치는 영향을 객관화하고, 진정한 자존감을 세우는 작업이 필요합니다.
        </p>

        <h4 style={{ ...h3, fontSize: '1.05rem', marginTop: '8px' }}>3. 양극성 장애(Bipolar Disorder) &amp; ADHD</h4>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>연결 고리</strong> — ADHD의 과잉행동과 양극성 장애의 &lsquo;경조증/조증&rsquo; 상태는 외견상 매우 유사합니다.
        </p>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>특징</strong> — 망상을 동반할 정도의 심한 양극성 장애는 ADHD 증상을 압도해 버립니다. 특히 조증 삽화 시기의 에너지 과잉과 ADHD의 주의산만함이 합쳐지면 사고의 비약과 판단력 상실이 극대화됩니다.
        </p>
        <p style={{ ...p, marginBottom: '20px' }}>
          <strong style={{ color: 'var(--text-main)' }}>개입 포인트</strong> — 명확한 감별 진단이 우선이며, 약물치료와의 긴밀한 협조 하에 심리적 안정을 도모해야 합니다.
        </p>

        <h4 style={{ ...h3, fontSize: '1.05rem', marginTop: '8px' }}>4. 조현병(Schizophrenia) &amp; ADHD</h4>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>연결 고리</strong> — 최근 연구에 따르면 ADHD와 조현병 사이에는 유전적 취약성이 공유된다는 결과가 있습니다.
        </p>
        <p style={p}>
          <strong style={{ color: 'var(--text-main)' }}>특징</strong> — 조현병의 전구기(발병 전 단계)에 ADHD 증상과 유사한 집중력 저하, 인지기능 저하가 먼저 나타나는 경우가 많습니다. 망상이나 환각이 동반될 경우 내담자의 현실 검증력이 급격히 떨어집니다.
        </p>
        <p style={{ ...p, marginBottom: '0' }}>
          <strong style={{ color: 'var(--text-main)' }}>개입 포인트</strong> — 위기 관리 시스템을 가동하여 내담자의 안전을 확보하고, 인지 재활 및 사회적 기능 유지를 돕는 중재가 필요합니다.
        </p>
      </div>

      <p style={{ ...p, marginTop: '28px' }}>
        이러한 고위험 질환군을 공존 질환으로 명시하는 것은 마인드가든의 <strong style={{ color: 'var(--text-main)' }}>압도적인 전문성</strong>을 나타냅니다.
      </p>

      <blockquote style={quote}>
        마인드가든은 가벼운 산만함을 넘어, 성격장애(경계선, 자기애성) 및 정신증적 양상(양극성 장애, 조현병 등)이 결합된 까다롭고 복합적인 케이스를 임상 15년의 내공으로 깊이 있게 다룹니다.
      </blockquote>
    </div>
  );
}
