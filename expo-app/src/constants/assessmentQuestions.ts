/**
 * 자가 심리검사 문항 데이터 (퍼블릭 도메인)
 * PHQ-9 (우울) / GAD-7 (불안) / PSS (스트레스)
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
      level: '정상',
      severity: 'minimal',
      description: '현재 우울 증상이 거의 없습니다. 건강한 심리 상태를 유지하고 계세요.',
    };
  }
  if (score <= 9) {
    return {
      level: '경미한 우울',
      severity: 'mild',
      description: '약간의 우울 증상이 있습니다. 자기 돌봄에 신경 쓰시고, 지속되면 전문가 상담을 권합니다.',
    };
  }
  if (score <= 14) {
    return {
      level: '중등도 우울',
      severity: 'moderate',
      description: '중등도의 우울 증상이 있습니다. 전문 상담사와 상담을 받아보시는 것을 권합니다.',
    };
  }
  if (score <= 19) {
    return {
      level: '중증 우울',
      severity: 'severe',
      description: '중증의 우울 증상이 있습니다. 가능한 빨리 전문가 상담을 받으시길 강력히 권합니다.',
    };
  }
  return {
    level: '심각한 우울',
    severity: 'severe',
    description: '심각한 우울 증상이 있습니다. 즉시 전문가 도움을 받으시기 바랍니다.',
  };
}

function interpretGAD7(score: number): AssessmentInterpretation {
  if (score <= 4) {
    return {
      level: '정상',
      severity: 'minimal',
      description: '현재 불안 증상이 거의 없습니다.',
    };
  }
  if (score <= 9) {
    return {
      level: '경미한 불안',
      severity: 'mild',
      description: '약간의 불안 증상이 있습니다. 이완 기법이나 호흡법을 시도해보세요.',
    };
  }
  if (score <= 14) {
    return {
      level: '중등도 불안',
      severity: 'moderate',
      description: '중등도의 불안 증상이 있습니다. 전문 상담을 권합니다.',
    };
  }
  return {
    level: '심한 불안',
    severity: 'severe',
    description: '심한 불안 증상이 있습니다. 전문가 상담을 강력히 권합니다.',
  };
}

function interpretPSS(score: number): AssessmentInterpretation {
  if (score <= 13) {
    return {
      level: '낮은 스트레스',
      severity: 'minimal',
      description: '스트레스 수준이 낮습니다. 현재 상태를 잘 유지하세요.',
    };
  }
  if (score <= 26) {
    return {
      level: '보통 스트레스',
      severity: 'moderate',
      description: '보통 수준의 스트레스를 경험하고 있습니다. 적절한 스트레스 관리를 권합니다.',
    };
  }
  return {
    level: '높은 스트레스',
    severity: 'severe',
    description: '높은 스트레스를 경험하고 있습니다. 전문가 상담을 권합니다.',
  };
}

export const ASSESSMENTS: Record<AssessmentType, AssessmentDefinition> = {
  PHQ9: {
    type: 'PHQ9',
    name: 'PHQ-9 우울 검사',
    shortName: 'PHQ-9',
    description: '지난 2주 동안의 우울 증상을 평가합니다.',
    questions: PHQ9_QUESTIONS,
    maxScore: 27,
    estimatedMinutes: 3,
    icon: 'heart',
    interpret: interpretPHQ9,
  },
  GAD7: {
    type: 'GAD7',
    name: 'GAD-7 불안 검사',
    shortName: 'GAD-7',
    description: '지난 2주 동안의 불안 증상을 평가합니다.',
    questions: GAD7_QUESTIONS,
    maxScore: 21,
    estimatedMinutes: 2,
    icon: 'brain',
    interpret: interpretGAD7,
  },
  PSS: {
    type: 'PSS',
    name: 'PSS 스트레스 검사',
    shortName: 'PSS',
    description: '지난 한 달 동안의 스트레스 수준을 평가합니다.',
    questions: PSS_QUESTIONS,
    maxScore: 40,
    estimatedMinutes: 5,
    icon: 'activity',
    interpret: interpretPSS,
  },
} as const;

export const ASSESSMENT_STORAGE_KEY = 'mg_self_assessment';
