/**
 * 웰니스 공통 카피 — 의료·광고 표현·저작권 정책 (`EXPO_NATIVE_APP_PLAN.md` §10.1)
 *
 * @author MindGarden
 * @since 2026-05-13
 */

/** 모든 웰니스 화면·PHQ/GAD/PSS 결과에 공통: 의료행위 대체 금지 고지 */
export const WELLNESS_NON_MEDICAL_DISCLAIMER_KO =
  '이 기능은 일상적 마음 돌봄·자기 이해를 위한 참고용 콘텐츠이며, 의학적 진단·의료행위·처방을 대체하지 않습니다. 불편이 지속되면 의료기관 또는 전문 상담을 이용하세요.';

/** 자가 점검(PHQ-9, GAD-7, PSS) 전용 보조 문구 */
export const WELLNESS_ASSESSMENT_REFERENCE_FOOTER_KO =
  '표시되는 점수·등급은 설문 응답에 따른 참고 요약이며, 임상적 판단이나 의료적 효과를 의미하지 않습니다. 도구별 사용·인용 조건은 원 저작·배포 정책을 따릅니다.';

/**
 * Phase 4-A 「마음 날씨」 — AI 분석 카드 하단 고정 고지.
 * `MIND_WEATHER_UI_UX_SPEC.md` §5 카피 초안 (법무 검토 필요).
 */
export const MIND_WEATHER_DISCLAIMER_KO =
  '이 분석은 기록을 돕기 위한 참고용 요약이며, 의학적 진단이나 처방을 대체하지 않습니다.';

/**
 * 「마음 날씨」 상담사 공유 옵트인 모달 카피 묶음.
 * - `summaryConsent` 는 필수 동의(공유 시 최소 단위)
 * - `originalConsent` 는 선택 동의(원문 함께 제공)
 */
export const MIND_WEATHER_SHARE_COPY_KO = {
  modalTitle: '분석된 마음 날씨를 상담사님과 공유할까요?',
  description:
    '공유된 정보는 상담 목적 외에 사용되지 않으며, 언제든 설정에서 공유를 철회할 수 있습니다.',
  summaryConsentLabel: 'AI 요약 및 감정 키워드 공유에 동의합니다.',
  originalConsentLabel: '작성한 원문(메모/일기)도 함께 공유합니다.',
  summaryConsentHelper: '상담사님이 진행 중인 상담의 맥락을 파악할 수 있어요.',
  originalConsentHelper: '필요할 때만 켜 주세요. 언제든 끌 수 있습니다.',
  ctaShare: '상담사에게 공유하기',
  ctaCancel: '나만 보기',
  shareSuccessTitle: '공유 완료',
  shareSuccessMessage:
    '담당 상담사에게 마음 날씨 카드를 공유했어요. 상담사 앱으로 알림이 전달됩니다.',
  unshareConfirm: '공유를 철회하면 상담사 화면에서 이 카드가 즉시 보이지 않아요.',
} as const;
