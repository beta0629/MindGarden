/**
 * ADHD 간이 체크리스트 문항 (교육·선별 목적, 의학적 진단 도구 아님).
 * 부주의·과잉행동·충동성 등 일반적으로 알려진 영역을 일상 언어로 구성.
 */

import { checklistLegalNotice } from '@/lib/checklist-legal-notice';

export type AdhdSelfCheckItem = {
  id: string;
  prompt: string;
  hint: string;
};

/** '자주 그렇다'에 해당할 때 가산되는 점수 (문항당 0 또는 1) */
export const SCORE_IF_OFTEN = 1;

/** @deprecated 이름 호환 — `checklistLegalNotice` 사용 권장 */
export const adhdSelfCheckLegalNotice = checklistLegalNotice;

export const adhdSelfCheckIntro = {
  title: 'ADHD 간이 체크리스트',
  lead: [
    adhdSelfCheckLegalNotice.paragraphs[0],
    adhdSelfCheckLegalNotice.paragraphs[1],
  ] as const,
  disclaimer: adhdSelfCheckLegalNotice.paragraphs[2],
};

export const adhdSelfCheckItems: AdhdSelfCheckItem[] = [
  {
    id: 'careless-mistakes',
    prompt:
      '학업이나 업무, 혹은 세부적인 활동을 할 때 부주의하여 실수를 자주 하는 편인가요?',
    hint: '꼼꼼함이 필요한 작업에서 반복적인 실수가 발생하는지 떠올려 보세요.',
  },
  {
    id: 'avoidance-sustain',
    prompt:
      '집중이 필요하거나 지루한 일은 미루거나 시작하기 어렵다고 느끼는 편인가요?',
    hint: '마감이 다가와서야 겨우 손대는 패턴이 있는지 살펴보세요.',
  },
  {
    id: 'listening-distract',
    prompt:
      '대화나 지시를 들을 때 자주 산만해지거나, 끝까지 집중해 듣기 어렵다고 느끼나요?',
    hint: '일상 대화뿐 아니라 수업·회의·설명을 들을 때의 경험을 떠올려 보세요.',
  },
  {
    id: 'disorganize-lose',
    prompt:
      '물건을 자주 잃어버리거나, 방·책상·일정 정리가 오래 가지 않는 편인가요?',
    hint: '열쇠, 지갑, 서류, 과제 등 필요한 것을 찾느라 시간을 자주 쓰는지 생각해 보세요.',
  },
  {
    id: 'restless-seated',
    prompt:
      '상황에 맞게 가만히 앉아 있거나 조용히 기다리기가 어렵다고 느끼나요?',
    hint: '안절부절하거나, 손·다리를 계속 움직이는 경향이 있는지 확인해 보세요.',
  },
  {
    id: 'interrupt-wait',
    prompt:
      '다른 사람의 차례를 기다리기 어렵거나, 말을 끼어들 때가 많은 편인가요?',
    hint: '대화 중 참기 어렵거나 답을 재촉하게 되는 경험이 있는지 떠올려 보세요.',
  },
  {
    id: 'impulsive-act',
    prompt:
      '충동적으로 말하거나 행동한 뒤, 나중에 미안하거나 부적절했다고 느낀 적이 자주 있나요?',
    hint: '갑자기 결정하거나 말이 앞서는 패턴을 생각해 보세요.',
  },
  {
    id: 'emotion-regulation',
    prompt:
      '사소한 일에도 감정이 금방 격해지거나, 가라앉히기까지 시간이 오래 걸린다고 느끼나요?',
    hint: '분노·좌절·불안이 일과 대인관계에 영향을 주는지 살펴보세요.',
  },
  {
    id: 'multitask-oversight',
    prompt:
      '여러 일을 동시에 하려다 중요한 일을 놓치거나, 한 가지를 끝내기 어렵다고 느끼나요?',
    hint: '시작은 많은데 마무리가 흐릿한 패턴이 있는지 떠올려 보세요.',
  },
  {
    id: 'time-deadlines',
    prompt:
      '약속·마감 일정을 자주 잊거나, 시간 배분과 계획을 세우는 데 어려움이 있나요?',
    hint: '알림이 없으면 놓치기 쉽다고 느끼는지 일상을 떠올려 보세요.',
  },
];

export const adhdSelfCheckLabels = {
  rarely: '거의 그렇지 않다',
  often: '자주 그렇다',
} as const;

/** 총점 구간별 안내 (총점 0~문항 수) */
export function getAdhdSelfCheckBand(total: number, max: number): {
  key: 'low' | 'mid' | 'high';
  title: string;
  body: string;
} {
  const ratio = max > 0 ? total / max : 0;
  if (ratio <= 0.35) {
    return {
      key: 'low',
      title: '일상적 범위에 가까운 응답',
      body: '모든 사람이 가끔 겪는 수준일 수 있습니다. 그래도 학교·직장·관계에서 지속적인 어려움이 있다면 전문가와 이야기 나누는 것이 도움이 됩니다.',
    };
  }
  if (ratio <= 0.65) {
    return {
      key: 'mid',
      title: '주의 깊게 살펴볼 만한 응답',
      body: '여러 영역에서 비슷한 패턴이 이어진다면, 단순한 습관 문제가 아닐 수 있습니다. 상담이나 전문가와의 평가를 고려해 보세요.',
    };
  }
  return {
    key: 'high',
    title: '전문적인 평가·지원을 권하는 응답',
    body: 'ADHD뿐 아니라 다른 가능성도 함께 살펴봐야 할 수 있습니다. 정확한 이해와 맞춤 지원을 위해 공신력 있는 기관에서 평가·상담을 받아 보시길 권합니다.',
  };
}
