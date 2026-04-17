/**
 * 포트원 결제모듈 V2 — 테넌트 PG 설정 UI·웹훅 안내용 상수.
 * 도메인은 코드에 고정하지 않고 {@link getPortOneV2WebhookDisplayUrl} 로 생성한다.
 *
 * @author CoreSolution
 * @since 2026-04-15
 */

/** PG 제공자 코드 (백엔드 PgProvider.IAMPORT) */
export const PG_PROVIDER_IAMPORT = 'IAMPORT';

/** 필터·폼 셀렉트 표시 라벨 (PgConfigurationForm, PgApprovalManagement 공통) */
export const PG_PROVIDER_IAMPORT_DISPLAY_LABEL = '아임포트 (포트원 결제모듈 V2)';

/**
 * 포트원 V2 웹훅 경로 (오리진 제외, `/api/v1/...` 로 시작)
 */
export const PORTONE_V2_WEBHOOK_PATH = '/api/v1/payments/webhooks/portone/v2';

export const PORTONE_V2_WEBHOOK_CONTENT_TYPE = 'application/json';

/** 포트원 콘솔 웹훅 Version (읽기 전용 안내) */
export const PORTONE_V2_WEBHOOK_VERSION = '2024-04-25';

/** tenant_pg_configurations.settings_json 키 (백엔드 TenantPgSettingsJsonKeys 와 동일) */
export const PORTONE_SETTINGS_KEY_WEBHOOK_SECRET = 'portoneWebhookSecret';

/**
 * 상단 안내 문구 (V1 혼동 방지)
 */
export const PORTONE_V2_NOTICE_LINE =
  '이 설정은 포트원 결제모듈 V2용입니다. V1(아임포트 REST V1 전용) 연동과 혼동하지 마세요.';

/**
 * 공개 웹훅 URL 표시용 오리진.
 * 운영에서 안내 URL이 실제 콜백 도메인과 달라야 하면 REACT_APP_PG_WEBHOOK_PUBLIC_ORIGIN 설정.
 *
 * @returns {string}
 */
export const getPortOneWebhookPublicOrigin = () => {
  const fromEnv = process.env.REACT_APP_PG_WEBHOOK_PUBLIC_ORIGIN;
  if (fromEnv !== undefined && fromEnv !== null && String(fromEnv).trim() !== '') {
    return String(fromEnv).trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
};

/**
 * 포트원 V2 웹훅 전체 URL (복사·안내용)
 *
 * @returns {string}
 */
export const getPortOneV2WebhookDisplayUrl = () => {
  const origin = getPortOneWebhookPublicOrigin();
  const path = PORTONE_V2_WEBHOOK_PATH;
  return origin ? `${origin}${path}` : path;
};
