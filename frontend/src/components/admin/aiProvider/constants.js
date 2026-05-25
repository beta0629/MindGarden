/**
 * AI 프로바이더 관리 페이지 상수.
 *
 * 디자이너 핸드오프 §2 / §4 / §7 — provider 목록·라벨·기본 모델·아이콘·i18n 키 SSOT.
 * 코드에서 하드코딩된 색상·간격은 절대 없으며, 디자인 토큰 (`unified-design-tokens.css`)
 * 에 정의된 변수를 CSS 측에서 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-24
 */

/** 페이지 라우팅 경로 — `App.js` 및 `lnbMenuUtils.js` 와 일치 필수 */
export const AI_PROVIDER_MANAGEMENT_ROUTE = '/admin/system/ai-providers';

/**
 * 디자이너 §2 — 4종 프로바이더 (라디오 카드 + 키 관리 행).
 * iconKey 는 lucide-react 아이콘 컴포넌트 이름 (없으면 fallback 처리).
 */
export const AI_PROVIDER_OPTIONS = Object.freeze([
  {
    id: 'openai',
    label: 'OpenAI',
    keyPrefix: 'OPENAI',
    iconKey: 'Bot',
    defaultModel: 'gpt-4o-mini',
    description: 'GPT 계열 (gpt-4o, gpt-4o-mini, o1 등)'
  },
  {
    id: 'gemini',
    label: 'Gemini',
    keyPrefix: 'GEMINI',
    iconKey: 'Sparkles',
    defaultModel: 'gemini-3.1-pro',
    description: 'Google Generative Language (gemini-2.5-flash 등)'
  },
  {
    id: 'claude',
    label: 'Claude',
    keyPrefix: 'CLAUDE',
    iconKey: 'BrainCircuit',
    defaultModel: 'claude-3-5-sonnet-20241022',
    description: 'Anthropic Claude 계열'
  },
  {
    id: 'replicate',
    label: 'Replicate',
    keyPrefix: 'REPLICATE',
    iconKey: 'Cpu',
    defaultModel: '',
    description: '이미지·LLM 모델 호스팅 (옵션)'
  }
]);

/** 통계 카드 기간 옵션 (탭 토글) — 디자이너 §4 */
export const AI_USAGE_PERIODS = Object.freeze([
  { id: 'today', labelKey: 'admin.aiProviderManagement.usage.today', label: '오늘' },
  { id: 'week', labelKey: 'admin.aiProviderManagement.usage.thisWeek', label: '이번 주' },
  { id: 'month', labelKey: 'admin.aiProviderManagement.usage.thisMonth', label: '이번 달' }
]);

/** 로그 상태 필터 옵션 — 디자이너 §5 */
export const AI_LOG_STATUS_OPTIONS = Object.freeze([
  { id: '', label: '전체' },
  { id: 'success', label: '성공' },
  { id: 'failed', label: '실패' }
]);

/** 백엔드 provider 라벨 (대문자) ↔ 화면 provider id (소문자) 매핑 */
export const PROVIDER_ID_BY_LABEL = Object.freeze({
  OPENAI: 'openai',
  GEMINI: 'gemini',
  CLAUDE: 'claude',
  REPLICATE: 'replicate'
});

/** 라벨 fallback (백엔드 라벨 → 사용자 표시 문자열) */
export const PROVIDER_DISPLAY_LABEL = Object.freeze({
  OPENAI: 'OpenAI',
  GEMINI: 'Gemini',
  CLAUDE: 'Claude',
  REPLICATE: 'Replicate',
  UNKNOWN: '기타'
});

/** API 키 미등록 가드 툴팁 — 디자이너 §2 (PR-3 시스템 설정과 동일 메시지) */
export const AI_PROVIDER_DISABLED_TOOLTIP = 'API 키 미등록 — 아래 "키 변경" 으로 등록 후 사용 가능';

/** 비-가드(claude/replicate) 안내 툴팁 */
export const AI_PROVIDER_UNGUARDED_TOOLTIP = '키 등록 가드 미지원 (입력 폼 기준 활성화)';

/** 로딩/에러 라벨 */
export const AI_PROVIDER_LABELS = Object.freeze({
  healthRefresh: '헬스 새로고침',
  healthRefreshLoading: '확인 중...',
  healthLoading: '헬스체크 중...',
  healthFailedPrefix: '헬스체크 실패',
  activePrefix: '현재 활성: ',
  unregistered: 'API 키 미등록',
  registered: '등록됨',
  emptyStateNoLogs: '조회된 호출 로그가 없습니다.',
  emptyStateNoStats: '통계 데이터가 없습니다.',
  detail: '상세',
  pagePrev: '이전',
  pageNext: '다음',
  saveKey: '키 저장',
  deleteKey: '키 삭제',
  changeKey: '키 변경',
  testKey: '키 테스트',
  apiKeyLabel: 'API 키',
  apiUrlLabel: 'API 주소',
  modelLabel: '모델',
  successRate: '성공률',
  failureRate: '실패율',
  fallbackRate: 'Fallback 비율',
  averageDuration: '평균 응답시간(ms)',
  totalTokens: '총 토큰',
  callsToday: '오늘 호출 수',
  callsThisWeek: '이번 주 호출 수',
  callsThisMonth: '이번 달 호출 수',
  filterProvider: '프로바이더',
  filterCaller: '호출자',
  filterStatus: '상태',
  filterAll: '전체',
  fallbackUnsupported: '미지원',
  detailPromptBody: '프롬프트 본문',
  detailResponseBody: 'AI 응답 본문',
  detailBodyEmpty: '본문이 저장되지 않았습니다 (V20260529_001 이전 호출)',
  detailBodyNotApplicable: '실패로 인해 응답이 저장되지 않았습니다'
});

/** 페이지·LNB i18n 키 (i18n 시스템 정착 시 사용) */
export const AI_PROVIDER_I18N_KEYS = Object.freeze({
  title: 'admin.aiProviderManagement.title',
  subtitle: 'admin.aiProviderManagement.subtitle',
  activeProvider: 'admin.aiProviderManagement.activeProvider',
  healthRefresh: 'admin.aiProviderManagement.healthRefresh',
  providerSelectTitle: 'admin.aiProviderManagement.providerSelect.title',
  providerSelectUnregistered: 'admin.aiProviderManagement.providerSelect.unregistered',
  apiKeyTitle: 'admin.aiProviderManagement.apiKey.title',
  apiKeyChange: 'admin.aiProviderManagement.apiKey.change',
  apiKeyDelete: 'admin.aiProviderManagement.apiKey.delete',
  usageTitle: 'admin.aiProviderManagement.usage.title',
  usageToday: 'admin.aiProviderManagement.usage.today',
  usageThisWeek: 'admin.aiProviderManagement.usage.thisWeek',
  usageThisMonth: 'admin.aiProviderManagement.usage.thisMonth',
  usageSuccessRate: 'admin.aiProviderManagement.usage.successRate',
  usageFallbackRate: 'admin.aiProviderManagement.usage.fallbackRate',
  logsTitle: 'admin.aiProviderManagement.logs.title',
  logsFilterProvider: 'admin.aiProviderManagement.logs.filter.provider',
  logsFilterCaller: 'admin.aiProviderManagement.logs.filter.caller',
  logsFilterStatus: 'admin.aiProviderManagement.logs.filter.status',
  logsDetail: 'admin.aiProviderManagement.logs.detail',
  lnbLabel: 'admin.lnb.aiProviderManagement'
});

/** API 키 미등록 시 표시할 마스킹 (디자이너 §3 — `****1234`) */
export const maskApiKey = (key) => {
  if (!key) {
    return '';
  }
  const trimmed = String(key).trim();
  if (trimmed.length <= 4) {
    return '****';
  }
  return `****${trimmed.slice(-4)}`;
};
