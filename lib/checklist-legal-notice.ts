/**
 * 체크리스트 공통 면책 문구 (운영·법무 합의본).
 * ADHD 단일 체크리스트·/screening 플로우 등에서 동일하게 사용한다.
 */

export const checklistLegalNotice = {
  paragraphs: [
    '아동·청소년과 성인 모두 일상에서 겪을 수 있는 패턴을 기준으로 스스로 살펴볼 수 있도록 구성했습니다.',
    '이 점검은 의학적 진단을 대신하지 않으며, 정보 제공 목적입니다.',
    '결과는 의학적 진단을 대체하지 않습니다. 걱정이 있다면 전문가와 상담하시기 바랍니다.',
  ] as const,
  psychoExamBeforeLink: '전문적인 심리·신경심리 검사에 대해서는 ',
  psychoExamAfterLink: ' 페이지를 참고해 주세요.',
} as const;
