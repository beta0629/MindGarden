/**
 * Apple G1.2 UGC (P2-C) — EULA(이용약관) 본문 + 버전 상수.
 *
 * <p>디자이너 시안 §E 약관 텍스트 38줄을 그대로 옮긴 SSOT. **임의 변경 금지** —
 * §2(무관용)·§3(24시간)·§4(학대 금지)·§6(자동 신고) 조항은 Apple G1.2 4대 키워드
 * (`no tolerance` / `objectionable content` / `abusive users` / `24-hour review`)
 * 보존을 위해 한 글자도 손대지 않는다.</p>
 *
 * <p>버전 상수 {@link EULA_CURRENT_VERSION} 은 백엔드 `EulaVersion.CURRENT` 와 동기 유지.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */

/** 현재 시행 EULA 버전 (BE `EulaVersion.CURRENT` 와 동기). */
export const EULA_CURRENT_VERSION = '1.0.0';

/** 시행일 (ISO-8601). */
export const EULA_EFFECTIVE_DATE = '2026-06-11';

/**
 * 디자이너 시안 §E 본문 — 38줄.
 *
 * 줄 수 점검을 자동화하려면 `EULA_TERMS_BODY.split('\n').length === 38` 을 확인한다.
 */
export const EULA_TERMS_BODY = `마인드가든 커뮤니티 서비스 이용 약관 (v1.0.0 — 2026-06-11 시행)

제1조 (목적)
이 약관은 주식회사 마인드가든이 제공하는 마인드가든 모바일 앱 및 부속 서비스(이하 "서비스")의
이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 (콘텐츠 무관용 정책) ★ Apple G1.2 필수
회사는 안전한 커뮤니티를 위해 다음 콘텐츠에 대해 무관용(zero-tolerance) 원칙을 적용합니다.
다음에 해당하는 콘텐츠는 사전 통보 없이 즉시 삭제되며, 게시한 회원은 영구 이용 제한 대상입니다.
  1) 음란·외설·성적 수치심을 유발하는 표현
  2) 폭력·혐오·차별·괴롭힘 표현
  3) 자해·자살을 조장하거나 미화하는 표현
  4) 사기·스팸·불법 광고
  5) 타인의 권리(저작권, 초상권, 개인정보)를 침해하는 표현
  6) 기타 사회 통념상 부적절한 (objectionable) 콘텐츠

제3조 (24시간 내 검토 의무) ★ Apple G1.2 필수
회사는 회원의 신고를 접수한 시점부터 24시간 이내에 해당 콘텐츠와 게시자를 검토하며,
위반이 확인되면 즉시 다음 조치 중 하나 이상을 수행합니다.
  1) 콘텐츠 삭제 또는 비공개 처리
  2) 게시자 일시 정지 (최대 30일)
  3) 게시자 영구 이용 제한 (반복·중대 위반 시)

제4조 (이용자 행동 규범 — 학대 행위 금지) ★ Apple G1.2 필수
회원은 다른 회원에게 다음의 학대(abusive) 행위를 하여서는 안 됩니다.
  1) 욕설, 인격 모독, 위협
  2) 스토킹, 반복 괴롭힘, 도배
  3) 미성년자에 대한 부적절한 접근
  4) 회사의 사전 동의 없는 상업적 권유
위반 시 제3조의 24시간 검토 절차에 따라 정지 또는 영구 차단됩니다.

제5조 (신고 및 차단)
회원은 부적절한 콘텐츠 또는 학대 행위를 신고하거나 해당 회원을 차단할 수 있습니다.
차단된 회원의 콘텐츠는 즉시 비노출되며, 차단 해제는 마이페이지에서 가능합니다.

제6조 (자동 신고 및 모니터링)
회사는 키워드 자동 탐지·반복 신고 누적·관리자 점검을 통해 위반 콘텐츠를 사전 탐지할 수 있으며,
긴급한 경우 신고 없이도 콘텐츠를 삭제하고 회원을 정지할 수 있습니다.

제7조 (개인정보)
회원의 개인정보는 별도의 [개인정보 처리방침]에 따라 보호되며, 본 약관의 일부로 간주됩니다.

제8조 (약관 변경)
회사는 약관을 변경할 수 있으며, 중요한 변경 시 사전 통지 후 회원의 재동의를 받습니다.
재동의 거부 시 서비스 이용이 제한됩니다.

부칙
이 약관은 2026-06-11부터 시행합니다.`;

/**
 * Apple G1.2 4대 필수 키워드 — 검증·테스트용.
 *
 * <p>{@link EULA_TERMS_BODY} 가 모든 키워드를 포함하는지 jest 에서 확인한다.</p>
 */
export const EULA_REQUIRED_KEYWORDS: ReadonlyArray<string> = [
  'zero-tolerance',
  'objectionable',
  'abusive',
  '24시간',
];

/** 약관 §A 사이드 카피·체크박스 라벨 등 화면 상수. */
export const EULA_SCREEN_LABELS = {
  title: '서비스 이용 약관 동의',
  subtitle: '안전한 커뮤니티를 위해 동의가 필요합니다.',
  scrollHint: '약관을 끝까지 읽어 주세요',
  termsConsent: '(필수) 서비스 이용 약관 및 무관용 정책에 동의합니다.',
  privacyConsent: '(필수) 개인정보 처리방침에 동의합니다.',
  marketingConsent: '(선택) 마케팅 정보 수신에 동의합니다.',
  viewLink: '보기',
  cta: '동의하고 시작하기',
  ctaSubmitting: '동의 처리 중...',
  decline: '동의하지 않고 종료',
  declineModalTitle: '동의하지 않으면 사용이 제한됩니다.',
  declineModalBody:
    '약관에 동의하지 않으면 로그아웃됩니다.\n그래도 계속하시겠어요?',
  declineModalCancel: '취소',
  declineModalConfirm: '로그아웃 후 종료',
} as const;

/** 신고 시트 / 차단 모달 / 차단 목록의 공통 24시간 안내 카피. */
export const UGC_REVIEW_SLA_COPY = {
  reportInfoBanner:
    '신고 후 24시간 내 검토하며, 위반 사용자는 차단 또는 영구 정지 조치합니다.',
  reportSubmittedTitle: '신고가 접수되었어요',
  reportSubmittedBody:
    '신고하신 콘텐츠는 24시간 내 검토 후 조치됩니다.\n도움이 되어 주셔서 감사합니다.',
  blockedListFooter: '신고와 차단은 24시간 내 검토 정책에 따라 처리됩니다.',
} as const;
