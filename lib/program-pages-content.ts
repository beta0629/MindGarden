/**
 * ADHD 프로그램(대상·증상·치료·심리검사) 상세 페이지와 메인 플립 카드(#programs·#program-pages)의 단일 소스.
 * 카피 변경 시 이 파일만 수정하면 메인·GNB 상세가 함께 반영됩니다.
 */

export type ProgramPageId = 'target' | 'symptoms' | 'treatment' | 'test';

export const PROGRAM_PAGE_ORDER: ProgramPageId[] = [
  'target',
  'symptoms',
  'treatment',
  'test',
];

export type ProgramPageCopy = {
  href: string;
  /** 메인 프로그램 카드 제목 */
  cardTitle: string;
  /** 메인 프로그램 카드 부제 (상세 히어로 리드와 동일 메시지, 한 줄) */
  cardLead: string;
  /** 메인 #program-pages 플립 카드 뒷면 요약 */
  cardFlipBack: string;
  /** 상세 페이지 H1 두 줄 */
  heroTitle: readonly [string, string];
  /** 상세 페이지 이탤릭 리드 두 줄 */
  heroLead: readonly [string, string];
};

export const programPageContent: Record<ProgramPageId, ProgramPageCopy> = {
  target: {
    href: '/programs/target',
    cardTitle: '대상',
    cardLead: '각자의 발달 단계와 환경에 맞춘 세심한 접근이 필요합니다',
    cardFlipBack:
      '연령과 발달 단계, 가족·학교·직장 환경을 함께 고려해 지금 필요한 지원이 무엇인지 함께 짚어 드립니다.',
    heroTitle: ['누구를 위한', '프로그램인가요?'],
    heroLead: ['"각자의 발달 단계와 환경에 맞춘', '세심한 접근이 필요합니다"'],
  },
  symptoms: {
    href: '/programs/symptoms',
    cardTitle: '증상',
    cardLead: '단순한 산만함이 아닌 실행 기능의 어려움입니다',
    cardFlipBack:
      '산만함·충동성뿐 아니라 실행 기능, 정서, 대인관계까지 어려움의 패턴을 구조적으로 이해할 수 있도록 돕습니다.',
    heroTitle: ['주요 증상과', '동반 어려움'],
    heroLead: ['"단순한 산만함이 아닌', '실행 기능의 어려움입니다"'],
  },
  treatment: {
    href: '/programs/treatment',
    cardTitle: '상담 및 지원',
    cardLead: '증상 완화를 넘어 전인적 성장을 목표로 합니다',
    cardFlipBack:
      '약물 안내에 그치지 않고 상담·코칭·가족 작업 등을 조합해 삶의 맥락 안에서 변화를 설계합니다.',
    heroTitle: ['다각적이고', '통합적인 상담 접근'],
    heroLead: ['"증상 완화를 넘어', '전인적 성장을 목표로 합니다"'],
  },
  test: {
    href: '/programs/test',
    cardTitle: '심리검사',
    cardLead: '객관적이고 신뢰할 수 있는 평가가 상담의 시작입니다',
    cardFlipBack:
      '면담과 검사 결과를 바탕으로 강점과 어려움을 정리하고 이후 상담 방향을 명확히 제안합니다.',
    heroTitle: ['정확한 평가를 위한', '종합 심리검사'],
    heroLead: ['"객관적이고 신뢰할 수 있는', '평가가 치료의 시작입니다"'],
  },
};

/** 메인 #program-pages 체크리스트 카드 (프로그램 상세 `ProgramPageId`와 별도) */
export const programScreeningFlipCard = {
  href: '/screening' as const,
  cardTitle: 'ADHD & 공존질환 체크리스트',
  cardLead: '주제별 간이 체크',
  cardFlipBack:
    '주제별 간이 체크리스트로 먼저 살펴보실 수 있어요. 평가를 대신하지 않으며, 상담 전 참고용으로 활용하실 수 있습니다.',
};
