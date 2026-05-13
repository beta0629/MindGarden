/**
 * 자가 점검 문항 데이터 (PHQ-9 / GAD-7 / PSS-10)
 *
 * 원 도구는 각 저작자·배포 정책에 따른 사용 허락을 전제로 한다. 앱 내 해석·등급 문구는
 * **참고용 자기 이해**용이며 임상 진단·의료행위·처방을 구성하지 않는다 (`EXPO_NATIVE_APP_PLAN.md` §10.1).
 *
 * @author MindGarden
 * @since 2026-05-12
 */

export type AssessmentType = 'PHQ9' | 'GAD7' | 'PSS';
export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'severe';

export interface AssessmentInterpretation {
  readonly level: string;
  readonly severity: SeverityLevel;
  readonly description: string;
}

export interface OptionLabel {
  readonly score: number;
  readonly label: string;
}

export interface AssessmentDefinition {
  readonly type: AssessmentType;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly questions: readonly string[];
  readonly maxScore: number;
  readonly estimatedMinutes: number;
  readonly icon: string;
  readonly interpret: (score: number) => AssessmentInterpretation;
}

export const OPTION_LABELS: readonly OptionLabel[] = [
  { score: 0, label: '전혀 아니다' },
  { score: 1, label: '며칠간' },
  { score: 2, label: '절반 이상' },
  { score: 3, label: '거의 매일' },
] as const;

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  minimal: 'success',
  mild: 'info',
  moderate: 'warning',
  severe: 'error',
};

const PHQ9_QUESTIONS: readonly string[] = [
  '일에 대한 흥미나 즐거움이 거의 없다.',
  '기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다.',
  '잠들기 어렵거나, 자주 깼다, 또는 너무 많이 잤다.',
  '피곤하거나 기력이 없다고 느꼈다.',
  '식욕이 줄었거나 과식을 했다.',
  '자신이 나쁜 사람이라고 느끼거나, 실패자라고 느꼈다.',
  '신문을 읽거나 TV를 볼 때 집중하기 어려웠다.',
  '다른 사람들이 눈치챌 정도로 느리게 움직이거나 반대로 안절부절했다.',
  '차라리 죽는 것이 낫겠다는 생각을 했다.',
] as const;

const GAD7_QUESTIONS: readonly string[] = [
  '초조하거나 불안하거나 조마조마하게 느꼈다.',
  '걱정하는 것을 멈추거나 조절할 수 없었다.',
  '여러 가지 것들에 대해 지나치게 걱정했다.',
  '편하게 있기가 어려웠다.',
  '너무 안절부절해서 가만히 있기 어려웠다.',
  '쉽게 짜증이 나거나 화가 났다.',
  '마치 끔찍한 일이 일어날 것 같은 두려움을 느꼈다.',
] as const;

const PSS_QUESTIONS: readonly string[] = [
  '예상치 못한 일이 생겨서 기분이 상한 적이 있다.',
  '중요한 일을 통제할 수 없다고 느낀 적이 있다.',
  '초조하거나 스트레스를 받고 있다고 느낀 적이 있다.',
  '개인적 문제를 다루는 능력에 자신감을 느낀 적이 있다.',
  '일이 자기 뜻대로 진행되고 있다고 느낀 적이 있다.',
  '해야 할 일에 대처할 수 없다고 느낀 적이 있다.',
  '일상의 짜증을 잘 다룰 수 있었다.',
  '자신이 상황을 잘 통제하고 있다고 느낀 적이 있다.',
  '통제 밖의 일 때문에 화가 난 적이 있다.',
  '어려운 일이 너무 많이 쌓여서 극복할 수 없다고 느낀 적이 있다.',
] as const;

export const PSS_REVERSE_ITEMS = [3, 4, 6, 7] as const;

function interpretPHQ9(score: number): AssessmentInterpretation {
  if (score <= 4) {
    return {
      level: '참고·낮은 편',
      severity: 'minimal',
      description:
        '응답만 보면 최근 2주간 불편이 크게 느껴지지 않는 편입니다(참고용). 지속 불편이 있으면 전문 상담을 고려하세요.',
    };
  }
  if (score <= 9) {
    return {
      level: '경미한 불편 (참고)',
      severity: 'mild',
      description:
        '응답상 불편이 어느 정도 느껴질 수 있습니다. 자기 돌봄을 이어가고, 지속되면 전문 상담을 고려하세요.',
    };
  }
  if (score <= 14) {
    return {
      level: '중간 정도 불편 (참고)',
      severity: 'moderate',
      description:
        '응답상 불편이 중간 정도로 보입니다(참고용). 전문 상담을 받아보는 것을 권합니다.',
    };
  }
  if (score <= 19) {
    return {
      level: '높은 불편 (참고)',
      severity: 'severe',
      description:
        '응답상 불편이 높게 나타날 수 있습니다(참고용). 가까운 전문 상담·의료기관의 도움을 권합니다.',
    };
  }
  return {
    level: '매우 높은 불편 (참고)',
    severity: 'severe',
    description:
      '응답이 매우 높은 불편을 시사할 수 있습니다(참고용). 전문 상담·의료기관 도움을 받는 것을 권합니다.',
  };
}

function interpretGAD7(score: number): AssessmentInterpretation {
  if (score <= 4) {
    return {
      level: '참고·낮은 편',
      severity: 'minimal',
      description:
        '응답만 보면 최근 2주간 불안에 대한 불편이 크게 느껴지지 않는 편입니다(참고용).',
    };
  }
  if (score <= 9) {
    return {
      level: '경미한 불편 (참고)',
      severity: 'mild',
      description:
        '응답상 어느 정도 불안이 느껴질 수 있습니다. 이완·호흡을 시도하고, 지속되면 전문 상담을 고려하세요.',
    };
  }
  if (score <= 14) {
    return {
      level: '중간 정도 불편 (참고)',
      severity: 'moderate',
      description:
        '응답상 불안이 중간 정도로 느껴질 수 있습니다(참고용). 전문 상담을 권합니다.',
    };
  }
  return {
    level: '높은 불편 (참고)',
    severity: 'severe',
    description:
      '응답상 불안이 높게 느껴질 수 있습니다(참고용). 전문 상담·의료기관 도움을 권합니다.',
  };
}

function interpretPSS(score: number): AssessmentInterpretation {
  if (score <= 13) {
    return {
      level: '낮은 스트레스 (참고)',
      severity: 'minimal',
      description:
        '응답만 보면 스트레스가 크게 느껴지지 않는 편입니다(참고용). 현재 리듬을 유지하세요.',
    };
  }
  if (score <= 26) {
    return {
      level: '보통 스트레스',
      severity: 'moderate',
      description:
        '응답상 스트레스가 보통 수준으로 느껴질 수 있습니다(참고용). 스트레스 관리와 전문 상담을 고려하세요.',
    };
  }
  return {
    level: '높은 스트레스',
    severity: 'severe',
    description:
      '응답상 스트레스가 높게 느껴질 수 있습니다(참고용). 전문 상담·의료기관 도움을 권합니다.',
  };
}

export const ASSESSMENTS: Record<AssessmentType, AssessmentDefinition> = {
  PHQ9: {
    type: 'PHQ9',
    name: 'PHQ-9 우울 자가 점검',
    shortName: 'PHQ-9',
    description: '지난 2주 동안의 기분·행동을 스스로 살펴봅니다(참고용, 진단 아님).',
    questions: PHQ9_QUESTIONS,
    maxScore: 27,
    estimatedMinutes: 3,
    icon: 'heart',
    interpret: interpretPHQ9,
  },
  GAD7: {
    type: 'GAD7',
    name: 'GAD-7 불안 자가 점검',
    shortName: 'GAD-7',
    description: '지난 2주 동안의 불안에 대한 느낌을 스스로 살펴봅니다(참고용, 진단 아님).',
    questions: GAD7_QUESTIONS,
    maxScore: 21,
    estimatedMinutes: 2,
    icon: 'brain',
    interpret: interpretGAD7,
  },
  PSS: {
    type: 'PSS',
    name: 'PSS 스트레스 자가 점검',
    shortName: 'PSS',
    description: '지난 한 달 동안의 스트레스를 스스로 살펴봅니다(참고용, 진단 아님).',
    questions: PSS_QUESTIONS,
    maxScore: 40,
    estimatedMinutes: 5,
    icon: 'activity',
    interpret: interpretPSS,
  },
} as const;

export const ASSESSMENT_STORAGE_KEY = 'mg_self_assessment';

/** §11.1 데이터 소스 라벨: `WELLNESS_PHASE_3B_DATA_SOURCE` @see src/constants/wellnessDataSource.ts */
