/**
 * KICC 이지페이 PG 설정 UI·도움말 상수 (테넌트 PG 설정).
 *
 * @author CoreSolution
 * @since 2026-04-17
 */

/** 백엔드 {@code PgProvider.KICC} */
export const PG_PROVIDER_KICC = 'KICC';

/** 개발자 문서·LLM 인덱스 */
export const KICC_DOCS_LLM_INDEX_URL = 'https://docs.kicc.co.kr/online/llms.txt';

/** 온라인 결제 개요·API 도메인(테스트/운영) */
export const KICC_DOCS_ONLINE_PAYMENT_BASE = 'https://docs.kicc.co.kr/docs/online-payment/general/introduction';

/** AI 연동 가이드(민감정보·환경변수·타임아웃 등) */
export const KICC_DOCS_AI_GUIDE_URL = 'https://docs.kicc.co.kr/docs/online-payment/ai-solutions/llm';

/** tenant_pg_configurations.settings_json 키 (백엔드 TenantPgSettingsJsonKeys 와 동일) */
export const KICC_SETTINGS_KEY_EASYPAY_HOST_TEST = 'kiccEasypayApiHostTest';
export const KICC_SETTINGS_KEY_EASYPAY_HOST_PROD = 'kiccEasypayApiHostProd';
