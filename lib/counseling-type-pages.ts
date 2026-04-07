/**
 * 상담의 종류 상세 페이지 본문 (COUNSELING-TYPES-2026-04-02)
 * 효과·진단 보장 문구 없음. 문의는 GNB 정책(바텀시트) 준수.
 */

export type CounselingSection = {
  id: string;
  title: string;
  paragraphs: string[];
  internalLinks?: { href: string; label: string }[];
  variant?: 'hero' | 'split' | 'accent' | 'band';
  imagePosition?: 'left' | 'right';
};

export type CounselingPageData = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  sections: CounselingSection[];
  ctaTitle: string;
  ctaLines: string[];
};

export const COUNSELING_SLUGS = [
  'child-adolescent-adhd',
  'adult-adhd',
  'comorbidity',
  'counseling-areas',
] as const;

export type CounselingSlug = (typeof COUNSELING_SLUGS)[number];

export const COUNSELING_PAGES: Record<CounselingSlug, CounselingPageData> = {
  'child-adolescent-adhd': {
    slug: 'child-adolescent-adhd',
    metaTitle: '아동·청소년 ADHD 상담 | 마인드가든 심리상담센터',
    metaDescription:
      '아동·청소년 ADHD 관련 어려움을 이해하고, 가정·학교 맥락에서 맞춤 목표로 상담을 진행합니다. 마인드가든 심리상담센터.',
    h1: '아동·청소년 ADHD 상담',
    lead: '학교와 가정에서 주의력, 충동성, 과잉행동 등으로 일상 기능이 흔들릴 때, 발달 단계에 맞춰 내담자와 보호자와 함께 목표를 정리합니다.',
    sections: [
      {
        id: 'who',
        title: '이런 분들께 도움이 될 수 있습니다',
        paragraphs: [
          '수업·숙제·생활 루틴을 유지하기 어렵고, 또래 관계나 가족 소통에서 자주 마찰이 생기는 아동·청소년과 보호자.',
          '발달 단계에 따라 증상이 다르게 보일 수 있으며, 아래 내용은 일반적인 안내입니다. 개인별 상태는 상담·평가 과정에서 함께 살펴봅니다.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'features',
        title: '아동·청소년기에 흔히 논의되는 특징',
        paragraphs: [
          '집중 유지, 행동 조절, 시간 관리 등에서 어려움이 겹쳐 보일 수 있습니다. 진단·평가의 필요와 범위는 전문가와 상담하여 결정합니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'focus',
        title: '상담에서 다루는 초점',
        paragraphs: [
          '증상에 대한 이해를 바탕으로, 학교 적응, 또래 관계, 가족 대화 방식, 자기조절 루틴 등에서 우선순위를 내담자·보호자와 합의합니다.',
          '목표와 회기 구성은 개인차가 크므로 고정된 횟수나 결과를 약속하지 않습니다.',
        ],
        variant: 'split',
        imagePosition: 'left',
      },
      {
        id: 'family',
        title: '보호자 협력',
        paragraphs: [
          '가정에서의 일관된 지지와 과제·루틴이 상담 내용과 맞물릴 때 변화가 이어지기 쉽습니다. 보호자 면담·피드백을 과정에 포함할 수 있습니다.',
        ],
        variant: 'band',
      },
      {
        id: 'network',
        title: '다른 전문 영역과의 연계',
        paragraphs: [
          '필요하다고 판단될 때 의학·교육 등 다른 기관 안내를 논의할 수 있습니다. 연계 여부와 방식은 개별 상황에 따라 달라집니다.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'process',
        title: '진행 방식 안내',
        paragraphs: [
          '초기 면담에서 호소와 기대를 정리한 뒤, 상담 목표와 간격을 함께 정합니다. 진행 중 목표를 조정할 수 있습니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'related',
        title: '함께 읽으면 좋은 안내',
        paragraphs: ['다른 연령대나 동반 어려움에 대한 안내가 필요하면 아래 페이지를 참고해 주세요.'],
        internalLinks: [
          { href: '/counseling/adult-adhd', label: '성인 ADHD 상담' },
          { href: '/counseling/comorbidity', label: 'ADHD와 동반질환' },
        ],
        variant: 'band',
      },
    ],
    ctaTitle: '다음 단계',
    ctaLines: [
      '문의·상담 예약은 화면 하단 바텀시트(상담 예약·문의)를 이용해 주세요.',
      'GNB 메뉴 구성은 센터 정책에 따릅니다.',
    ],
  },

  'adult-adhd': {
    slug: 'adult-adhd',
    metaTitle: '성인 ADHD 상담 | 마인드가든 심리상담센터',
    metaDescription:
      '직장·가사·관계 맥락에서 성인 ADHD 관련 어려움을 다루는 상담 안내. 마인드가든 심리상담센터.',
    h1: '성인 ADHD 상담',
    lead: '산만함, 시간 관리, 정서 소진 등 일상 기능에 영향을 줄 때, 성인기의 맥락에서 이해와 실천 전략을 함께 찾습니다.',
    sections: [
      {
        id: 'who',
        title: '이런 분들께 도움이 될 수 있습니다',
        paragraphs: [
          '업무·가사·관계에서 반복적으로 일정·집중·감정 조절이 어렵고, 그로 인해 스트레스가 누적되는 성인 내담자.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'presentation',
        title: '성인기에 드러나는 모습',
        paragraphs: [
          '과잉행동이 두드러지지 않거나 인지적 보상으로 겉보기 기능이 높을 때, 어려움이 늦게 인지되는 경우가 있습니다. 여성 내담자는 사회적 기대와 맞물린 억제 경향 등이 논의될 수 있습니다.',
          '이 페이지의 설명은 교육 목적이며, 개인 진단을 의미하지 않습니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'focus',
        title: '상담에서의 초점',
        paragraphs: [
          '증상 라벨에만 머무르지 않고, 직장·관계·자기돌봄 맥락에서 기능 회복과 자기이해를 함께 다룹니다.',
        ],
        variant: 'split',
        imagePosition: 'left',
      },
      {
        id: 'assessment',
        title: '감별·평가',
        paragraphs: [
          '필요 시 심리검사·평가 절차를 안내할 수 있습니다. 결과와 해석은 전문가와의 상담을 통해 진행합니다.',
        ],
        variant: 'band',
      },
      {
        id: 'comorbid',
        title: '동반 어려움',
        paragraphs: [
          '우울·불안 등 다른 정서적 어려움과 겹칠 수 있습니다. 함께 다루는 방식은 내담자 상태와 목표에 따라 달라집니다.',
        ],
        internalLinks: [{ href: '/counseling/comorbidity', label: 'ADHD와 동반질환 안내' }],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'process',
        title: '진행 방식 안내',
        paragraphs: [
          '초기 면담에서 호소와 기대를 정리한 뒤, 상담 목표와 간격을 함께 정합니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'related',
        title: '함께 읽으면 좋은 안내',
        paragraphs: [],
        internalLinks: [
          { href: '/counseling/child-adolescent-adhd', label: '아동·청소년 ADHD 상담' },
          { href: '/counseling/comorbidity', label: 'ADHD와 동반질환' },
        ],
        variant: 'band',
      },
    ],
    ctaTitle: '다음 단계',
    ctaLines: [
      '문의·상담 예약은 화면 하단 바텀시트(상담 예약·문의)를 이용해 주세요.',
    ],
  },

  comorbidity: {
    slug: 'comorbidity',
    metaTitle: 'ADHD와 동반질환 | 마인드가든 심리상담센터',
    metaDescription:
      'ADHD와 함께 나타날 수 있는 정서·행동 어려움을 이해하고, 상담에서 목표를 함께 세우는 안내입니다.',
    h1: 'ADHD와 동반질환',
    lead: '핵심 어려움과 동반되는 증상을 구분해 이해하면, 상담과 지원의 방향을 더 명확히 잡을 수 있습니다.',
    sections: [
      {
        id: 'why',
        title: '왜 함께 이야기하는가',
        paragraphs: [
          'ADHD 특성과 다른 정서·행동 어려움이 겹칠 때, 한 가지 원인만으로 설명하기 어려운 경우가 있습니다. 상담에서는 이런 맥락을 함께 정리합니다.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'areas',
        title: '자주 논의되는 동반 영역',
        paragraphs: [
          '예를 들어 우울·불안, 수면, 관계 갈등 등이 언급될 수 있습니다. 아래는 일반적 교육용 나열이며, 개인에게 해당한다고 단정하지 않습니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'assessment',
        title: '감별평가의 의미',
        paragraphs: [
          '호소가 겹칠 때 우선 다룰 영역을 정리하면 개입 방향이 달라질 수 있습니다. 평가·해석은 전문 절차에 따릅니다.',
        ],
        variant: 'split',
        imagePosition: 'left',
      },
      {
        id: 'counseling',
        title: '상담 접근',
        paragraphs: [
          '동반 어려움을 동시에 고려한 목표를 세우고, 단기·중기 우선순위를 조정해 갑니다.',
        ],
        variant: 'band',
      },
      {
        id: 'medical',
        title: '의학적 치료와의 관계',
        paragraphs: [
          '약물 처방 등은 의료진의 영역입니다. 심리상담은 정서·행동·인지적 지지와 생활 맥락에서의 실천을 중심으로 합니다.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'experience',
        title: '센터의 접근',
        paragraphs: [
          '임상 경험을 바탕으로 개인별 상황에 맞춰 논의합니다. 결과를 보장하거나 특정 수치적 효과를 약속하지는 않습니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'related',
        title: '관련 상담 유형',
        paragraphs: [],
        internalLinks: [
          { href: '/counseling/child-adolescent-adhd', label: '아동·청소년 ADHD 상담' },
          { href: '/counseling/adult-adhd', label: '성인 ADHD 상담' },
        ],
        variant: 'band',
      },
    ],
    ctaTitle: '다음 단계',
    ctaLines: [
      '문의·상담 예약은 화면 하단 바텀시트(상담 예약·문의)를 이용해 주세요.',
    ],
  },

  'counseling-areas': {
    slug: 'counseling-areas',
    metaTitle: '상담 과목 안내 | 마인드가든 심리상담센터',
    metaDescription:
      '마인드가든 심리상담센터의 상담 방향과 과목 예시, 초기 상담에서 다루는 내용을 안내합니다.',
    h1: '상담 과목 안내',
    lead: '센터는 ADHD 및 관련 발달·정서 어려움을 중심 주제로 상담을 진행합니다. 과목은 내담자 호소와 합의에 따라 조정됩니다.',
    sections: [
      {
        id: 'direction',
        title: '센터가 다루는 방향',
        paragraphs: [
          'ADHD 경향성과 연관된 주의력, 행동 조절, 정서 조절, 관계·학교·직장 적응 등을 상담 목표와 연결해 논의합니다.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'examples',
        title: '상담 과목 예시',
        paragraphs: [
          '아동·청소년: 학습 습관, 또래 관계, 가족 규칙, 자기조절 루틴 등.',
          '성인: 업무·시간 관리, 관계 패턴, 번아웃·불안과의 공존 등.',
          '구체 과목은 초기 면담에서 호소에 맞춰 정리합니다.',
        ],
        variant: 'accent',
      },
      {
        id: 'out-of-scope',
        title: '다루기 어려운 경우',
        paragraphs: [
          '센터 역량·전문 분야 밖으로 판단되면 솔직히 안내하고, 다른 기관·전문가 연계를 논의할 수 있습니다.',
        ],
        variant: 'split',
        imagePosition: 'left',
      },
      {
        id: 'intake',
        title: '초기 상담에서 확인하는 것',
        paragraphs: [
          '현재 호소, 기대, 과거 상담·치료 경험, 안전과 관련해 필요한 확인 사항 등을 함께 살펴봅니다.',
        ],
        variant: 'band',
      },
      {
        id: 'format',
        title: '진행 형태',
        paragraphs: [
          '개별 상담을 기본으로 하며, 가족·부모 면담이 병행될 수 있습니다. 홈페이지 프로그램 안내와 용어를 맞추어 안내합니다.',
        ],
        variant: 'split',
        imagePosition: 'right',
      },
      {
        id: 'related',
        title: '유형별 안내',
        paragraphs: ['상담 유형별 상세는 아래 페이지를 참고해 주세요.'],
        internalLinks: [
          { href: '/counseling/child-adolescent-adhd', label: '아동·청소년 ADHD' },
          { href: '/counseling/adult-adhd', label: '성인 ADHD' },
          { href: '/counseling/comorbidity', label: '동반질환' },
        ],
        variant: 'accent',
      },
    ],
    ctaTitle: '다음 단계',
    ctaLines: [
      '문의·상담 예약은 화면 하단 바텀시트(상담 예약·문의)를 이용해 주세요.',
    ],
  },
};

export function getCounselingPage(slug: string): CounselingPageData | null {
  if (COUNSELING_SLUGS.includes(slug as CounselingSlug)) {
    return COUNSELING_PAGES[slug as CounselingSlug];
  }
  return null;
}
