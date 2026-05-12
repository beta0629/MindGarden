/**
 * 심리 교육 콘텐츠 Mock 데이터
 *
 * @author MindGarden
 * @since 2026-05-12
 */

export type PsychoCategory =
  | 'all'
  | 'stress'
  | 'emotion'
  | 'relationship'
  | 'selfcare';

export interface PsychoPage {
  readonly title: string;
  readonly body: string;
}

export interface PsychoArticle {
  readonly id: number;
  readonly category: PsychoCategory;
  readonly categoryLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly readMinutes: number;
  readonly pages: readonly PsychoPage[];
  readonly gradientColors: readonly [string, string];
}

export const PSYCHO_CATEGORIES: readonly {
  key: PsychoCategory | 'bookmarks';
  label: string;
}[] = [
  { key: 'all', label: '전체' },
  { key: 'stress', label: '스트레스 관리' },
  { key: 'emotion', label: '감정 이해' },
  { key: 'relationship', label: '관계' },
  { key: 'selfcare', label: '자기돌봄' },
  { key: 'bookmarks', label: '북마크' },
] as const;

import { colors } from '@/theme/tokens';

export const PSYCHO_GRADIENT_MAP: Record<
  PsychoCategory,
  readonly [string, string]
> = {
  all: [colors.client.primary, colors.client.primaryLight],
  stress: [colors.client.primary, colors.client.primaryLight],
  emotion: [colors.consultant.primaryLight, colors.client.accent],
  relationship: [colors.client.primaryLight, colors.client.primary],
  selfcare: [colors.client.accent, colors.consultant.accent],
} as const;

export const MOCK_PSYCHO_ARTICLES: PsychoArticle[] = [
  {
    id: 1,
    category: 'stress',
    categoryLabel: '스트레스 관리',
    title: '불안을 다스리는 5가지 호흡법',
    summary: '긴장되는 순간, 간단한 호흡법으로 마음을 가라앉힐 수 있습니다.',
    readMinutes: 3,
    gradientColors: PSYCHO_GRADIENT_MAP.stress,
    pages: [
      {
        title: '불안은 자연스러운 감정',
        body: '불안은 누구나 경험하는 자연스러운 감정입니다. 하지만 그것이 일상을 방해할 때, 우리는 이를 관리하는 방법을 배워야 합니다.',
      },
      {
        title: '4-7-8 호흡법',
        body: '코로 4초 들이쉬고, 7초 참고, 8초 내쉽니다. 이 방법은 부교감 신경을 활성화하여 빠르게 긴장을 완화합니다.',
      },
      {
        title: '복식호흡',
        body: '배에 손을 얹고 배가 부풀어 오르도록 깊이 호흡합니다. 가슴이 아닌 배로 호흡하면 더 깊은 이완이 됩니다.',
      },
      {
        title: '박스 브리딩',
        body: '4초 흡입 → 4초 멈춤 → 4초 호출 → 4초 멈춤을 반복합니다. 규칙적인 리듬이 안정감을 줍니다.',
      },
      {
        title: '꾸준한 연습이 핵심',
        body: '하루 5분, 아침과 저녁에 꾸준히 연습하면 불안 수준이 크게 낮아질 수 있습니다. 오늘부터 시작해보세요!',
      },
    ],
  },
  {
    id: 2,
    category: 'stress',
    categoryLabel: '스트레스 관리',
    title: '그라운딩 기법: 5-4-3-2-1',
    summary: '지금 이 순간으로 돌아오는 감각 기반 안정화 기법입니다.',
    readMinutes: 3,
    gradientColors: PSYCHO_GRADIENT_MAP.stress,
    pages: [
      {
        title: '현재로 돌아오기',
        body: '패닉이나 강한 불안이 찾아올 때, 감각에 집중하면 "지금 여기"로 돌아올 수 있습니다.',
      },
      {
        title: '5가지 보이는 것',
        body: '주변에서 보이는 것 5가지를 하나씩 소리 내어 말합니다. 색상, 모양, 크기를 구체적으로 관찰하세요.',
      },
      {
        title: '4가지 촉감 + 3가지 소리',
        body: '만질 수 있는 것 4개의 질감을 느끼고, 들리는 소리 3개에 귀를 기울입니다.',
      },
      {
        title: '2가지 냄새 + 1가지 맛',
        body: '냄새 2가지를 맡고, 맛 1가지를 느낍니다. 감각에 집중하면 불안은 미래의 걱정에서 현재로 앵커링됩니다.',
      },
    ],
  },
  {
    id: 3,
    category: 'emotion',
    categoryLabel: '감정 이해',
    title: '자동적 사고 잡아내기',
    summary: '무의식적으로 떠오르는 부정적 생각을 인식하고 바꾸는 방법.',
    readMinutes: 4,
    gradientColors: PSYCHO_GRADIENT_MAP.emotion,
    pages: [
      {
        title: '자동적 사고란?',
        body: '상황에 대해 즉각적으로 떠오르는 생각을 자동적 사고라고 합니다. 대부분 부정적이고 왜곡된 패턴을 따릅니다.',
      },
      {
        title: '잡아내는 방법',
        body: '감정이 급격히 변할 때 "지금 무슨 생각을 했지?" 자문합니다. 사고 기록지에 상황-생각-감정-결과를 적습니다.',
      },
      {
        title: '균형 잡힌 대안 만들기',
        body: '그 생각의 근거와 반증을 모두 찾아보고, 더 균형 잡힌 대안적 생각을 만들어봅니다.',
      },
    ],
  },
  {
    id: 4,
    category: 'emotion',
    categoryLabel: '감정 이해',
    title: '인지 왜곡 10가지 유형',
    summary: '흑백논리, 과잉일반화, 독심술 등 흔한 인지 왜곡 패턴을 알아봅시다.',
    readMinutes: 6,
    gradientColors: PSYCHO_GRADIENT_MAP.emotion,
    pages: [
      {
        title: '인지 왜곡이란?',
        body: '우리의 생각에는 다양한 왜곡이 존재합니다. 이를 인식하는 것이 변화의 첫걸음입니다.',
      },
      {
        title: '흑백논리 & 과잉일반화',
        body: '모 아니면 도식의 사고, 한 번의 실패로 항상 그럴 거라 단정짓는 패턴입니다.',
      },
      {
        title: '독심술 & 파국화',
        body: '타인의 생각을 마음대로 추측하고, 작은 문제를 크게 확대하는 왜곡입니다.',
      },
      {
        title: '감정적 추론 & 당위적 사고',
        body: '느낌이 곧 사실이라 생각하고, "~해야 한다"에 집착하는 패턴을 인식해보세요.',
      },
    ],
  },
  {
    id: 5,
    category: 'relationship',
    categoryLabel: '관계',
    title: '비폭력 대화(NVC) 4단계',
    summary: '갈등 없이 진심을 전하는 마샬 로젠버그의 대화법.',
    readMinutes: 5,
    gradientColors: PSYCHO_GRADIENT_MAP.relationship,
    pages: [
      {
        title: '비폭력 대화란?',
        body: '비폭력 대화(NVC)는 판단 없이 서로의 욕구를 이해하고 연결하는 대화 방법입니다.',
      },
      {
        title: '1단계: 관찰',
        body: '판단 없이 사실만 말합니다.\n"네가 30분 늦었어" (O)\n"넌 항상 늦잖아" (X)',
      },
      {
        title: '2단계: 느낌 + 필요',
        body: '자신의 감정을 표현하고(나는 걱정이 되었어), 충족되지 않은 욕구를 말합니다(약속이 지켜지면 안심이 돼).',
      },
      {
        title: '3단계: 부탁',
        body: '구체적인 행동을 요청합니다. "다음에는 늦을 것 같으면 미리 연락해줄 수 있어?"',
      },
    ],
  },
  {
    id: 6,
    category: 'relationship',
    categoryLabel: '관계',
    title: '건강한 경계 설정하기',
    summary: '나를 지키면서도 관계를 유지하는 경계의 기술.',
    readMinutes: 4,
    gradientColors: PSYCHO_GRADIENT_MAP.relationship,
    pages: [
      {
        title: '경계란?',
        body: '"여기까지는 괜찮고, 여기부터는 불편해요"의 선입니다. 자기 존중과 타인 존중의 균형이죠.',
      },
      {
        title: '자기 인식',
        body: '불편함을 느끼는 상황을 파악하고, 명확하게 표현합니다. "나는 ~할 때 불편해" I-message로 전합니다.',
      },
      {
        title: '일관성 유지',
        body: '한번 정한 경계는 일관되게 유지합니다. 경계를 존중하지 않는 관계는 적절한 거리를 둡니다.',
      },
    ],
  },
  {
    id: 7,
    category: 'selfcare',
    categoryLabel: '자기돌봄',
    title: '내면의 비판자 다루기',
    summary: '자기 비난의 목소리를 인식하고 자비로운 태도로 바꾸는 법.',
    readMinutes: 4,
    gradientColors: PSYCHO_GRADIENT_MAP.selfcare,
    pages: [
      {
        title: '내면의 비판자',
        body: '우리 안에는 끊임없이 비판하는 목소리가 있습니다. "넌 그것도 못해?", "노력해봤자 소용없어"',
      },
      {
        title: '인식하기',
        body: '"아, 지금 내면의 비판자가 말하고 있구나" — 그 목소리를 3인칭으로 바라봅니다.',
      },
      {
        title: '자기 자비로 전환',
        body: '친한 친구에게 하듯 나에게 말합니다. 비판의 근거를 객관적으로 검증해봅니다.',
      },
    ],
  },
  {
    id: 8,
    category: 'selfcare',
    categoryLabel: '자기돌봄',
    title: '작은 성공 수집하기',
    summary: '일상의 작은 성취를 모아 자신감을 키우는 실용적 방법.',
    readMinutes: 3,
    gradientColors: PSYCHO_GRADIENT_MAP.selfcare,
    pages: [
      {
        title: '작은 성공의 힘',
        body: '자존감은 하루아침에 바뀌지 않습니다. 매일 3가지 "잘한 것"을 적어보세요.',
      },
      {
        title: '기준 낮추기',
        body: '"밥을 챙겨 먹었다"도 충분한 성공입니다. To-Do 대신 Done 리스트를 만들어봅시다.',
      },
      {
        title: '칭찬 수용하기',
        body: '"별거 아니에요" 대신 "감사합니다"로 답합니다. 6개월 후 당신의 성공 컬렉션은 놀라울 것입니다.',
      },
    ],
  },
] as const;
