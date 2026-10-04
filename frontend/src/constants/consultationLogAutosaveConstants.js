/**
 * 상담일지 초안 자동저장 — 수치·정책 단일 상수 모음(SSOT).
 *
 * <p>호출부에는 숫자 리터럴을 두지 않는다. 타이밍·재시도·저장소 이름·API 경로를
 * 모두 여기서만 바꾼다.</p>
 *
 * <h3>저장 위치 정책 (2026-10-04)</h3>
 * <ul>
 *   <li>1차: <strong>서버 초안</strong>(consultation_record_drafts, 본문 암호화·작성자 전용)</li>
 *   <li>2차: 서버 실패·오프라인일 때만 <strong>세션 키로 암호화한 IndexedDB</strong> 백업</li>
 *   <li>본문의 localStorage·sessionStorage 평문 저장은 금지. 레거시 키는 첫 로드에서 정리.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

/** 로컬 스냅샷 JSON 스키마 버전 */
export const CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION = 1;

/** 입력이 멈춘 뒤 초안 저장까지 대기(ms) — 2026-10-04 5s → 3s */
export const CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS = 3000;

/** 더티 상태에서 최소 이 간격마다 한 번은 저장(ms) — 2026-10-04 60s → 30s */
export const CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS = 30000;

/**
 * @deprecated 2026-10-04 — {@link CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS} 로 통일.
 * 외부 import 호환용 alias.
 */
export const CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS = CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS;

/**
 * @deprecated 2026-10-04 — {@link CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS} 로 통일.
 */
export const CONSULTATION_LOG_LOCAL_AUTOSAVE_MAX_INTERVAL_MS = CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS;

/** 서버 초안 저장 실패 시 재시도 지연(ms). 지수 백오프 대신 명시 테이블 — 길이가 최대 재시도 횟수. */
export const CONSULTATION_LOG_AUTOSAVE_RETRY_BACKOFF_MS = [2000, 5000, 15000];

/** 상담일지 서버 초안(세션·X-Tenant-Id) API 경로 — 쿼리: consultationId, consultantId */
export const CONSULTATION_LOG_SERVER_DRAFT_API_PATH = '/api/v1/schedules/consultation-records/draft';

/**
 * 초안 PUT expectedVersion 불일치(400) 시 재조회 후 재시도 횟수.
 * 무한 루프 방지 — 1회만.
 */
export const CONSULTATION_LOG_DRAFT_VERSION_CONFLICT_RETRY_COUNT = 1;

/** ValidationException.field / 메시지에서 버전 충돌 판별용 */
export const CONSULTATION_LOG_DRAFT_EXPECTED_VERSION_FIELD = 'expectedVersion';

/** 동일 브라우저 탭 간 편집 충돌 통지 채널 이름 */
export const CONSULTATION_LOG_DRAFT_BROADCAST_CHANNEL = 'mg.consultationLogDraft';

/** IndexedDB 백업 DB 이름 */
export const CONSULTATION_LOG_BACKUP_DB_NAME = 'mg-consultation-log-backup';

/** IndexedDB 백업 object store 이름 */
export const CONSULTATION_LOG_BACKUP_STORE_NAME = 'drafts';

/** IndexedDB 백업 스키마 버전 */
export const CONSULTATION_LOG_BACKUP_DB_VERSION = 1;

/** 세션 키 파생용 WebCrypto 알고리즘 (추출 불가 키) */
export const CONSULTATION_LOG_BACKUP_CRYPTO_ALGORITHM = 'AES-GCM';

/** AES-GCM 키 길이(bit) */
export const CONSULTATION_LOG_BACKUP_CRYPTO_KEY_LENGTH = 256;

/** AES-GCM IV 길이(byte) */
export const CONSULTATION_LOG_BACKUP_CRYPTO_IV_BYTES = 12;

/**
 * 폐기 대상 레거시 평문 localStorage 초안 키 접두어.
 * 배포 후 첫 로드와 로그아웃·계정 전환에서 모두 제거한다.
 */
export const CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX = 'mg.cl.localDraft';

/**
 * 초안 로컬 보존 TTL(ms). 공유 PC·단말 유출 리스크 완화용 짧은 보존.
 * 레거시 키 1회 복구 제안에도 같은 기준을 쓴다.
 */
export const CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

/** 임시저장 시각 표시 로케일·타임존 (KST 고정) */
export const CONSULTATION_LOG_DRAFT_TIME_LOCALE = 'ko-KR';

/** 임시저장 시각 표시 타임존 */
export const CONSULTATION_LOG_DRAFT_TIME_ZONE = 'Asia/Seoul';

/** 세션 만료 후 되돌아올 화면을 로그인 흐름에 전달할 쿼리 파라미터 이름 */
export const LOGIN_RETURN_URL_PARAM = 'redirect';

/**
 * 상담일지 모달 "큰 본문" textarea 공통 최대 글자수.
 *
 * 적용 대상 (슈퍼블록 4개 + 풀폭 진행 평가):
 * <ul>
 *   <li>{@code clientCondition} — 내담자 상태</li>
 *   <li>{@code mainIssues} — 주요 이슈</li>
 *   <li>{@code interventionMethods} — 개입 방법</li>
 *   <li>{@code clientResponse} — 내담자 반응</li>
 *   <li>{@code progressEvaluation} — 진행 평가</li>
 * </ul>
 *
 * 백엔드 {@code ConsultationRecord} 동일 필드 {@code @Size(max)} 값과 일치해야 한다.
 */
export const CONSULTATION_LOG_TEXTAREA_MAX_LENGTH = 4000;

/**
 * @deprecated 2026-06-12 — {@link CONSULTATION_LOG_TEXTAREA_MAX_LENGTH}로 통일.
 * 외부에서 import 중인 모듈 호환을 위해 유지하며, 동일 값으로 alias.
 */
export const CONSULTATION_LOG_CLIENT_CONDITION_MAX_LENGTH = CONSULTATION_LOG_TEXTAREA_MAX_LENGTH;
