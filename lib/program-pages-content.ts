/**
 * ADHD 프로그램(대상·증상·치료·심리검사) 상세 페이지와 메인 #programs 카드의 단일 소스.
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
    heroTitle: ['누구를 위한', '프로그램인가요?'],
    heroLead: ['"각자의 발달 단계와 환경에 맞춘', '세심한 접근이 필요합니다"'],
  },
  symptoms: {
    href: '/programs/symptoms',
    cardTitle: '증상',
    cardLead: '단순한 산만함이 아닌 실행 기능의 어려움입니다',
    heroTitle: ['주요 증상과', '동반 어려움'],
    heroLead: ['"단순한 산만함이 아닌', '실행 기능의 어려움입니다"'],
  },
  treatment: {
    href: '/programs/treatment',
    cardTitle: '상담 및 지원',
    cardLead: '증상 완화를 넘어 전인적 성장을 목표로 합니다',
    heroTitle: ['다각적이고', '통합적인 상담 접근'],
    heroLead: ['"증상 완화를 넘어', '전인적 성장을 목표로 합니다"'],
  },
  test: {
    href: '/programs/test',
    cardTitle: '심리검사',
    cardLead: '객관적이고 신뢰할 수 있는 평가가 상담의 시작입니다',
    heroTitle: ['정확한 평가를 위한', '종합 심리검사'],
    heroLead: ['"객관적이고 신뢰할 수 있는', '평가가 치료의 시작입니다"'],
  },
};
