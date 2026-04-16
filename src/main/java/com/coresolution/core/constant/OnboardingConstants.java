package com.coresolution.core.constant;

import java.text.MessageFormat;

/**
 * 온보딩 시스템 상수 정의
 * 하드코딩 금지 원칙에 따라 모든 상수를 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */
public class OnboardingConstants {
    
    // 공통 코드 그룹 상수
    public static final String CODE_GROUP_ONBOARDING_STATUS = "ONBOARDING_STATUS";
    public static final String CODE_GROUP_RISK_LEVEL = "RISK_LEVEL";
    public static final String CODE_GROUP_BUSINESS_TYPE = "BUSINESS_TYPE";
    
    // 공통 코드 값 상수 (기본값, 공통 코드에서 조회 실패 시 사용)
    public static final String CODE_VALUE_PENDING = "PENDING";
    public static final String CODE_VALUE_APPROVED = "APPROVED";
    public static final String CODE_VALUE_ON_HOLD = "ON_HOLD";
    public static final String CODE_VALUE_REJECTED = "REJECTED";
    public static final String CODE_VALUE_LOW = "LOW";
    public static final String CODE_VALUE_DEFAULT_BUSINESS_TYPE = "CONSULTATION"; // 기본 업종 (공통 코드에서 조회 실패 시 사용)
    
    // 에러 메시지 상수
    public static final String ERROR_TENANT_NOT_FOUND = "온보딩 요청을 찾을 수 없습니다: {0}";
    public static final String ERROR_EMAIL_DUPLICATE = "이미 해당 이메일로 테넌트가 생성되어 있습니다.";
    public static final String ERROR_INVALID_STATUS = "유효하지 않은 상태 코드입니다: {0}";
    public static final String ERROR_RETRY_ONLY_ON_HOLD = "재시도는 ON_HOLD 상태인 경우에만 가능합니다. 현재 상태: {0}";
    public static final String ERROR_ONBOARDING_REQUEST_NOT_FOUND = "온보딩 요청을 찾을 수 없습니다. ID와 이메일을 확인해주세요.";

    /** 온보딩 요청 생성 시 checklist_json 병합 실패 */
    public static final String ERROR_ONBOARDING_CHECKLIST_MERGE_FAILED =
            "checklist_json 병합 또는 직렬화에 실패했습니다. JSON 형식과 필드 값을 확인해주세요.";

    /** 연락 이메일이 있는 승인 건에서 checklist_json 파싱 실패 */
    public static final String ERROR_ONBOARDING_CHECKLIST_PARSE_FOR_APPROVAL =
            "checklist_json 파싱에 실패하여 승인을 진행할 수 없습니다. 요청 데이터를 수정한 뒤 다시 시도해주세요.";

    /** 승인 시 연락 이메일은 있는데 관리자 초기 비밀번호가 없음 */
    public static final String ERROR_ONBOARDING_ADMIN_PASSWORD_REQUIRED_FOR_APPROVAL =
            "연락 이메일이 등록된 온보딩은 승인 시 checklist_json에 유효한 adminPassword가 필요합니다. "
                    + "요청을 수정하거나 비밀번호를 포함한 뒤 다시 승인해주세요.";

    /** 온보딩 요청 생성 시 관리자 초기 비밀번호 누락 */
    public static final String ERROR_ONBOARDING_ADMIN_PASSWORD_REQUIRED_ON_CREATE =
            "관리자 초기 비밀번호(adminPassword)는 필수입니다. checklist_json 또는 요청 본문에 포함해주세요.";

    /** CAPTCHA(Turnstile) 검증이 활성화된 환경에서 토큰 미제출 */
    public static final String ERROR_ONBOARDING_CAPTCHA_TOKEN_REQUIRED =
            "보안 확인(CAPTCHA) 토큰이 필요합니다.";

    /** CAPTCHA(Turnstile) 원격 검증 실패 */
    public static final String ERROR_ONBOARDING_CAPTCHA_VERIFICATION_FAILED =
            "보안 확인(CAPTCHA) 검증에 실패했습니다. 다시 시도해주세요.";
    
    // 온보딩 프로세스 단계 상수
    public static final String STEP_TENANT_CREATE = "TENANT_CREATE";
    public static final String STEP_ROLE_APPLY = "ROLE_APPLY";
    public static final String STEP_ADMIN_CREATE = "ADMIN_CREATE";
    public static final String STEP_DASHBOARD_CREATE = "DASHBOARD_CREATE";
    public static final String STEP_COMPLETE = "COMPLETE";
    public static final String STEP_PROCEDURE_START = "PROCEDURE_START";

    /**
     * 승인 직후 테넌트 시딩이 백그라운드로 큐에 올라갔음을 initializationStatusJson.phase에 표시
     */
    public static final String PHASE_POST_APPROVAL_INITIALIZATION_PENDING =
            "POST_APPROVAL_INITIALIZATION_PENDING";

    /**
     * 재승인 경로에서 시딩 대기 중
     */
    public static final String PHASE_REAPPROVAL_INITIALIZATION_PENDING =
            "REAPPROVAL_INITIALIZATION_PENDING";
    
    // 온보딩 프로세스 상태 상수
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_SKIPPED = "SKIPPED";
    public static final String STATUS_PENDING = "PENDING";
    
    // 온보딩 프로세스 메시지 상수
    public static final String MSG_TENANT_CREATE_START = "테넌트 생성/활성화 시작...";
    public static final String MSG_TENANT_CREATE_COMPLETE = "테넌트 생성/활성화 완료";
    public static final String MSG_TENANT_CREATE_FAILED = "테넌트 생성/활성화 실패";
    public static final String MSG_ROLE_APPLY_START = "역할 템플릿 적용 시작...";
    public static final String MSG_ROLE_APPLY_COMPLETE = "역할 템플릿 적용 완료";
    public static final String MSG_ROLE_APPLY_FAILED = "역할 템플릿 적용 실패";
    public static final String MSG_ADMIN_CREATE_START = "관리자 계정 생성 시작...";
    public static final String MSG_ADMIN_CREATE_COMPLETE = "관리자 계정 생성 완료";
    public static final String MSG_ADMIN_CREATE_FAILED = "관리자 계정 생성 실패";
    public static final String MSG_ADMIN_CREATE_SKIPPED = "관리자 계정 정보 없음";

    /** 연락 이메일은 있으나 비밀번호 해시가 없어 관리자 생성 불가 (승인 중단) */
    public static final String MSG_ADMIN_CREATE_BLOCKED_NO_PASSWORD_HASH =
            "연락 이메일이 있으나 adminPassword 해시가 없어 관리자 계정을 생성할 수 없습니다.";
    public static final String MSG_DASHBOARD_CREATE_START = "대시보드 생성 시작...";
    public static final String MSG_DASHBOARD_CREATE_COMPLETE = "대시보드 생성 완료";
    public static final String MSG_DASHBOARD_CREATE_FAILED = "대시보드 생성 실패";
    public static final String MSG_ALL_STEPS_COMPLETE = "모든 단계 완료";
    public static final String MSG_PROCESS_COMPLETE = "온보딩 승인 프로세스 완료: 테넌트 생성, 역할 적용, 관리자 계정 생성, 대시보드 생성 완료";

    /** 프로시저 성공 직후 Java에서 대시보드·관리자 tenant 역할 할당을 보강했을 때 */
    public static final String MSG_POST_PROCEDURE_RECONCILE_COMPLETE =
            "프로시저 이후 대시보드·관리자 역할 정합성 보강 완료";

    /** 관리자 users 행은 있으나 원장(DIRECTOR) tenant_role 매핑·할당에 실패 */
    public static final String MSG_ADMIN_DIRECTOR_ROLE_ASSIGNMENT_FAILED =
            "관리자 계정에 원장(관리자) 테넌트 역할을 할당할 수 없습니다. tenant_roles·role_templates를 확인하세요.";

    /** 온보딩 승인 시 user_role_assignments.assignment_reason 기본값 (DB 프로시저와 동일 문구) */
    public static final String ASSIGNMENT_REASON_ONBOARDING_AUTO = "온보딩 승인 시 자동 할당";
    
    // 로그 구분선 상수
    public static final String LOG_SEPARATOR = "==========================================";
    
    // SQL 쿼리 상수
    public static final String SQL_COUNT_TENANT_ROLES = 
            "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)";
    
    // 락 타임아웃 관련 오류 메시지 패턴
    public static final String ERROR_PATTERN_LOCK_WAIT_TIMEOUT = "Lock wait timeout";
    public static final String ERROR_PATTERN_LOCK_TIMEOUT = "lock timeout";
    public static final String ERROR_PATTERN_DEADLOCK = "deadlock";
    public static final String ERROR_PATTERN_QUERY_INTERRUPTED = "Query execution was interrupted";
    public static final String ERROR_PATTERN_INTERRUPTED = "interrupted";
    public static final String ERROR_CODE_1317 = "1317";
    
    // 재시도 설정 상수
    public static final int MAX_RETRY_ATTEMPTS = 10;
    public static final long BASE_RETRY_DELAY_MS = 2000L;
    public static final int TRANSACTION_TIMEOUT_SECONDS = 60;

    // --- 테넌트 공통코드 시드 (OnboardingServiceImpl insertDefaultTenantCommonCodes / insertTenantRoleCodes) ---

    /** 온보딩 시드 공통코드: 생성자 기본값 */
    public static final String CREATED_BY_SYSTEM_ONBOARDING = "SYSTEM_ONBOARDING";

    public static final String TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE = "CONSULTATION_PACKAGE";
    public static final String TENANT_SEED_CODE_VALUE_CP_SINGLE_100000 = "SINGLE_100000";
    public static final String TENANT_SEED_KO_LABEL_SINGLE_100000_WON = "단회기 100,000원";
    public static final String TENANT_SEED_DESC_ONE_SESSION_CONSULTATION_PACKAGE = "1회기 상담 패키지";
    public static final String TENANT_SEED_EXTRA_CP_SINGLE_100000 =
            "{\"price\": 100000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}";
    public static final int TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_100000 = 9;

    /** 상담 패키지(CONSULTATION_PACKAGE) 시드 — 패키지형 */
    public static final String TENANT_SEED_CODE_VALUE_CP_INDIVIDUAL = "INDIVIDUAL";
    public static final String TENANT_SEED_EXTRA_CP_PACKAGE_INDIVIDUAL =
            "{\"price\": 80000, \"sessions\": 20, \"duration\": 50, \"unit\": \"회\"}";
    public static final int TENANT_SEED_SORT_CP_PACKAGE_INDIVIDUAL = 1;

    public static final String TENANT_SEED_CODE_VALUE_CP_FAMILY = "FAMILY";
    public static final String TENANT_SEED_EXTRA_CP_PACKAGE_FAMILY =
            "{\"price\": 120000, \"sessions\": 20, \"duration\": 60, \"unit\": \"회\"}";
    public static final int TENANT_SEED_SORT_CP_PACKAGE_FAMILY = 2;

    public static final String TENANT_SEED_CODE_VALUE_CP_GROUP = "GROUP";
    public static final String TENANT_SEED_DESC_CP_PACKAGE_GROUP = "그룹 심리상담";
    public static final String TENANT_SEED_EXTRA_CP_PACKAGE_GROUP =
            "{\"price\": 50000, \"sessions\": 20, \"duration\": 90, \"unit\": \"회\"}";
    public static final int TENANT_SEED_SORT_CP_PACKAGE_GROUP = 3;

    public static final String TENANT_SEED_CODE_VALUE_CP_SINGLE_75000 = "SINGLE_75000";
    public static final String TENANT_SEED_KO_LABEL_SINGLE_75000_WON = "단회기 75,000원";
    public static final String TENANT_SEED_EXTRA_CP_SINGLE_75000 =
            "{\"price\": 75000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}";
    public static final int TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_75000 = 4;

    public static final String TENANT_SEED_CODE_VALUE_CP_SINGLE_80000 = "SINGLE_80000";
    public static final String TENANT_SEED_KO_LABEL_SINGLE_80000_WON = "단회기 80,000원";
    public static final String TENANT_SEED_EXTRA_CP_SINGLE_80000 =
            "{\"price\": 80000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}";
    public static final int TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_80000 = 5;

    public static final String TENANT_SEED_CODE_VALUE_CP_SINGLE_85000 = "SINGLE_85000";
    public static final String TENANT_SEED_KO_LABEL_SINGLE_85000_WON = "단회기 85,000원";
    public static final String TENANT_SEED_EXTRA_CP_SINGLE_85000 =
            "{\"price\": 85000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}";
    public static final int TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_85000 = 6;

    public static final String TENANT_SEED_CODE_VALUE_CP_SINGLE_90000 = "SINGLE_90000";
    public static final String TENANT_SEED_KO_LABEL_SINGLE_90000_WON = "단회기 90,000원";
    public static final String TENANT_SEED_EXTRA_CP_SINGLE_90000 =
            "{\"price\": 90000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}";
    public static final int TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_90000 = 7;

    public static final String TENANT_SEED_CODE_VALUE_CP_SINGLE_95000 = "SINGLE_95000";
    public static final String TENANT_SEED_KO_LABEL_SINGLE_95000_WON = "단회기 95,000원";
    public static final String TENANT_SEED_EXTRA_CP_SINGLE_95000 =
            "{\"price\": 95000, \"duration\": 50, \"unit\": \"회\", \"sessions\": 1}";
    public static final int TENANT_SEED_SORT_CONSULTATION_PACKAGE_SINGLE_95000 = 8;

    public static final String TENANT_COMMON_CODE_GROUP_PAYMENT_METHOD = "PAYMENT_METHOD";
    public static final String TENANT_COMMON_CODE_VALUE_PAYMENT_CASH = "CASH";
    public static final String TENANT_COMMON_CODE_VALUE_PAYMENT_CARD = "CARD";
    public static final String TENANT_COMMON_CODE_VALUE_PAYMENT_TRANSFER = "TRANSFER";
    public static final String TENANT_COMMON_LABEL_CASH = "현금";
    public static final String TENANT_COMMON_DESC_PAYMENT_CASH = "현금 결제";
    public static final String TENANT_COMMON_LABEL_CARD = "카드";
    public static final String TENANT_COMMON_DESC_PAYMENT_CARD = "카드 결제";
    public static final String TENANT_COMMON_LABEL_TRANSFER = "계좌이체";
    public static final String TENANT_COMMON_DESC_PAYMENT_TRANSFER = "계좌이체 결제";
    public static final int TENANT_SEED_SORT_PAYMENT_METHOD_CASH = 1;
    public static final int TENANT_SEED_SORT_PAYMENT_METHOD_CARD = 2;
    public static final int TENANT_SEED_SORT_PAYMENT_METHOD_TRANSFER = 3;

    /**
     * 테넌트 시드: 전문분야(SPECIALTY) — codeValue, 표시명, 설명, 정렬 문자열
     */
    public static final String[][] TENANT_SEED_SPECIALTY_ROWS = {
            {"DEPRESSION", "우울증", "우울증 상담", "1"},
            {"ANXIETY", "불안장애", "불안장애 상담", "2"},
            {"TRAUMA", "트라우마", "트라우마 상담", "3"},
            {"RELATIONSHIP", "인간관계", "인간관계 상담", "4"},
            {"FAMILY", "가족상담", "가족 상담", "5"},
            {"COUPLE", "부부상담", "부부 상담", "6"},
            {"CHILD", "아동상담", "아동 상담", "7"},
            {"ADOLESCENT", "청소년상담", "청소년 상담", "8"},
            {"ADULT", "성인상담", "성인 상담", "9"},
            {"STRESS", "스트레스", "스트레스 관리 상담", "10"},
            {"CAREER", "진로상담", "진로 상담", "11"},
    };

    public static final String TENANT_COMMON_CODE_GROUP_SPECIALTY = "SPECIALTY";

    public static final String TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE = "CONSULTATION_TYPE";
    public static final String TENANT_SEED_EXTRA_CONSULTATION_TYPE_INDIVIDUAL = "{\"durationMinutes\":50}";
    public static final String TENANT_SEED_EXTRA_CONSULTATION_TYPE_FAMILY = "{\"durationMinutes\":100}";
    public static final String TENANT_SEED_EXTRA_CONSULTATION_TYPE_COUPLE = "{\"durationMinutes\":80}";
    public static final String TENANT_SEED_EXTRA_CONSULTATION_TYPE_INITIAL = "{\"durationMinutes\":60}";
    public static final String TENANT_SEED_EXTRA_CONSULTATION_TYPE_GROUP = "{\"durationMinutes\":90}";
    public static final int TENANT_SEED_SORT_CONSULTATION_TYPE_INDIVIDUAL = 1;
    public static final int TENANT_SEED_SORT_CONSULTATION_TYPE_FAMILY = 2;
    public static final int TENANT_SEED_SORT_CONSULTATION_TYPE_COUPLE = 3;
    public static final int TENANT_SEED_SORT_CONSULTATION_TYPE_INITIAL = 4;
    public static final int TENANT_SEED_SORT_CONSULTATION_TYPE_GROUP = 5;
    public static final String TENANT_SEED_KO_NAME_CT_INDIVIDUAL = "개인상담";
    public static final String TENANT_SEED_DESC_CT_INDIVIDUAL_1_1 = "1:1 개인 심리상담";
    public static final String TENANT_SEED_KO_NAME_CT_FAMILY = "가족상담";
    public static final String TENANT_SEED_DESC_CT_FAMILY = "가족 단위 상담";
    public static final String TENANT_SEED_KO_NAME_CT_COUPLE = "부부상담";
    public static final String TENANT_SEED_DESC_CT_COUPLE = "부부 상담";
    public static final String TENANT_SEED_KO_NAME_CT_INITIAL = "초기상담";
    public static final String TENANT_SEED_DESC_CT_INITIAL = "초기 상담";
    public static final String TENANT_SEED_KO_NAME_CT_GROUP = "집단상담";
    public static final String TENANT_SEED_DESC_CT_GROUP = "집단·그룹 상담";

    public static final String TENANT_COMMON_CODE_GROUP_RESPONSIBILITY = "RESPONSIBILITY";
    public static final String TENANT_COMMON_CODE_VALUE_RESPONSIBILITY_COUNSELING = "COUNSELING";
    public static final String TENANT_COMMON_CODE_VALUE_RESPONSIBILITY_ADMINISTRATION = "ADMINISTRATION";
    public static final String TENANT_SEED_LABEL_RESPONSIBILITY_COUNSELING = "상담";
    public static final String TENANT_SEED_DESC_RESPONSIBILITY_COUNSELING = "상담 업무";
    public static final String TENANT_SEED_LABEL_RESPONSIBILITY_ADMIN = "행정";
    public static final String TENANT_SEED_DESC_RESPONSIBILITY_ADMIN = "행정 업무";
    public static final int TENANT_SEED_SORT_RESPONSIBILITY_COUNSELING = 1;
    public static final int TENANT_SEED_SORT_RESPONSIBILITY_ADMIN = 2;

    public static final String TENANT_COMMON_CODE_GROUP_PACKAGE_TYPE = "PACKAGE_TYPE";
    public static final String TENANT_SEED_LABEL_PT_INDIVIDUAL = "개인 상담";
    public static final String TENANT_SEED_DESC_PT_INDIVIDUAL = "1:1 개인 상담";
    public static final String TENANT_SEED_LABEL_PT_GROUP = "그룹 상담";
    public static final String TENANT_SEED_DESC_PT_GROUP = "그룹 상담";
    public static final int TENANT_SEED_SORT_PACKAGE_TYPE_INDIVIDUAL = 1;
    public static final int TENANT_SEED_SORT_PACKAGE_TYPE_GROUP = 2;

    public static final String TENANT_COMMON_CODE_GROUP_MAPPING_STATUS = "MAPPING_STATUS";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_PENDING_PAYMENT = "PENDING_PAYMENT";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_ACTIVE = "ACTIVE";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_INACTIVE = "INACTIVE";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_SUSPENDED = "SUSPENDED";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_TERMINATED = "TERMINATED";
    public static final String TENANT_COMMON_CODE_VALUE_MAPPING_SESSIONS_EXHAUSTED = "SESSIONS_EXHAUSTED";
    public static final String TENANT_SEED_LABEL_MS_PENDING_PAYMENT = "결제 대기";
    public static final String TENANT_SEED_DESC_MS_PENDING_PAYMENT = "결제 대기 중인 매칭";
    public static final String TENANT_SEED_LABEL_MS_PAYMENT_CONFIRMED = "결제 확인";
    public static final String TENANT_SEED_DESC_MS_PAYMENT_CONFIRMED = "결제가 확인된 매칭";
    public static final String TENANT_SEED_LABEL_MS_ACTIVE = "활성";
    public static final String TENANT_SEED_DESC_MS_ACTIVE = "활성 상태의 매칭";
    public static final String TENANT_SEED_LABEL_MS_INACTIVE = "비활성";
    public static final String TENANT_SEED_DESC_MS_INACTIVE = "비활성 상태의 매칭";
    public static final String TENANT_SEED_LABEL_MS_SUSPENDED = "일시정지";
    public static final String TENANT_SEED_DESC_MS_SUSPENDED = "일시정지된 매칭";
    public static final String TENANT_SEED_LABEL_MS_TERMINATED = "종료";
    public static final String TENANT_SEED_DESC_MS_TERMINATED = "종료된 매칭";
    public static final String TENANT_SEED_LABEL_MS_SESSIONS_EXHAUSTED = "회기 소진";
    public static final String TENANT_SEED_DESC_MS_SESSIONS_EXHAUSTED = "회기가 모두 소진된 매칭";
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_1 = 1;
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_2 = 2;
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_3 = 3;
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_4 = 4;
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_5 = 5;
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_6 = 6;
    public static final int TENANT_SEED_SORT_MAPPING_STATUS_7 = 7;

    public static final String LOG_MSG_TENANT_COMMON_CODES_BATCH_SAVE_OK =
            "✅ 기본 테넌트 공통코드 배치 저장 완료: tenantId={}, insertedCount={}";
    public static final String LOG_MSG_TENANT_COMMON_CODES_ALL_EXIST = "✅ 모든 공통코드가 이미 존재함: tenantId={}";
    public static final String LOG_MSG_TENANT_COMMON_CODES_INSERT_FAIL =
            "❌ 기본 테넌트 공통코드 추가 실패: tenantId={}, error={}";
    public static final String LOG_DEBUG_COMMON_CODE_ALREADY_EXISTS =
            "공통코드가 이미 존재함 (건너뜀): tenantId={}, codeGroup={}, codeValue={}";

    public static final String LOG_MSG_ADD_DEFAULT_TENANT_CODES_REQUEST =
            "🔄 테넌트 기본 공통코드 추가 요청: tenantId={}";
    public static final String LOG_WARN_EXISTING_CODE_COUNT_FAILED = "기존 코드 개수 확인 실패 (계속 진행): {}";
    public static final String LOG_WARN_AFTER_CODE_COUNT_FAILED = "추가 후 코드 개수 확인 실패: {}";
    public static final String LOG_MSG_ADD_DEFAULT_TENANT_CODES_DONE =
            "✅ 테넌트 기본 공통코드 추가 완료: tenantId={}, 추가된 코드={}개";

    public static final String LOG_WARN_DEPRECATED_INSERT_COMMON_CODE_IF_NOT_EXISTS =
            "⚠️ Deprecated 메서드 호출: insertCommonCodeIfNotExists는 더 이상 사용하지 않습니다. 배치 처리를 사용하세요.";

    public static final String LOG_WARN_TENANT_ID_EMPTY_SKIP_ROLE_CODES =
            "⚠️ 테넌트 ID가 없어 역할 코드 생성 건너뜁니다.";
    public static final String LOG_WARN_BUSINESS_TYPE_EMPTY_SKIP_ROLE_CODES =
            "⚠️ 비즈니스 타입이 없어 역할 코드 생성 건너뜁니다: tenantId={}";
    public static final String LOG_MSG_TENANT_ROLE_CODES_START =
            "🔄 테넌트 역할 코드 생성 시작 (배치 처리): tenantId={}, businessType={}";

    /** 공통코드 시드: sortOrder 미지정 시 기본값 */
    public static final int TENANT_COMMON_CODE_DEFAULT_SORT_ORDER = 0;

    public static final String TENANT_COMMON_CODE_GROUP_ROLE = "ROLE";
    public static final String TENANT_BUSINESS_TYPE_CONSULTATION = "CONSULTATION";
    public static final String TENANT_BUSINESS_TYPE_COUNSELING = "COUNSELING";
    public static final String TENANT_BUSINESS_TYPE_ACADEMY = "ACADEMY";
    public static final String TENANT_BUSINESS_TYPE_FOOD_SERVICE = "FOOD_SERVICE";
    public static final String TENANT_BUSINESS_TYPE_TAEKWONDO = "TAEKWONDO";

    public static final String TENANT_ROLE_CODE_VALUE_ADMIN = "ADMIN";
    public static final String TENANT_ROLE_CODE_VALUE_CONSULTANT = "CONSULTANT";
    public static final String TENANT_ROLE_CODE_VALUE_CLIENT = "CLIENT";
    public static final String TENANT_ROLE_CODE_VALUE_STAFF = "STAFF";
    public static final String TENANT_ROLE_CODE_VALUE_PARENT = "PARENT";

    public static final String TENANT_ROLE_JSON_CONSULTATION_ADMIN =
            "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}";
    public static final String TENANT_ROLE_JSON_CONSULTATION_CONSULTANT =
            "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}";
    public static final String TENANT_ROLE_JSON_CONSULTATION_CLIENT =
            "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}";
    public static final String TENANT_ROLE_JSON_CONSULTATION_STAFF =
            "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"CONSULTATION\"}";

    public static final String TENANT_ROLE_JSON_COUNSELING_ADMIN =
            "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}";
    public static final String TENANT_ROLE_JSON_COUNSELING_CONSULTANT =
            "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}";
    public static final String TENANT_ROLE_JSON_COUNSELING_CLIENT =
            "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}";
    public static final String TENANT_ROLE_JSON_COUNSELING_STAFF =
            "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"COUNSELING\"}";

    public static final String TENANT_ROLE_JSON_ACADEMY_ADMIN =
            "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}";
    public static final String TENANT_ROLE_JSON_ACADEMY_CONSULTANT =
            "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}";
    public static final String TENANT_ROLE_JSON_ACADEMY_CLIENT =
            "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}";
    public static final String TENANT_ROLE_JSON_ACADEMY_PARENT =
            "{\"isAdmin\": false, \"roleType\": \"PARENT\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}";
    public static final String TENANT_ROLE_JSON_ACADEMY_STAFF =
            "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"ACADEMY\"}";

    public static final String TENANT_ROLE_JSON_FOOD_SERVICE_ADMIN =
            "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}";
    public static final String TENANT_ROLE_JSON_FOOD_SERVICE_CONSULTANT =
            "{\"isAdmin\": false, \"roleType\": \"CONSULTANT\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}";
    public static final String TENANT_ROLE_JSON_FOOD_SERVICE_CLIENT =
            "{\"isAdmin\": false, \"roleType\": \"CLIENT\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}";
    public static final String TENANT_ROLE_JSON_FOOD_SERVICE_STAFF =
            "{\"isAdmin\": false, \"isStaff\": true, \"roleType\": \"STAFF\", \"isDefault\": true, \"businessType\": \"FOOD_SERVICE\"}";

    public static final String TENANT_ROLE_LABEL_DIRECTOR = "원장";
    public static final String TENANT_ROLE_LABEL_CONSULTANT = "상담사";
    public static final String TENANT_ROLE_LABEL_CLIENT = "내담자";
    public static final String TENANT_ROLE_LABEL_STAFF_OFFICE = "사무원";
    public static final String TENANT_ROLE_DESC_CONSULTATION_DIRECTOR = "상담소 원장 역할";
    public static final String TENANT_ROLE_DESC_CONSULTATION_CONSULTANT = "상담사 역할";
    public static final String TENANT_ROLE_DESC_CONSULTATION_CLIENT = "내담자 역할";
    public static final String TENANT_ROLE_DESC_CONSULTATION_STAFF = "사무원 역할";

    public static final String TENANT_ROLE_DESC_COUNSELING_DIRECTOR = "심리상담 원장 역할";
    public static final String TENANT_ROLE_DESC_COUNSELING_CONSULTANT = "심리상담 상담사 역할";
    public static final String TENANT_ROLE_DESC_COUNSELING_CLIENT = "심리상담 내담자 역할";
    public static final String TENANT_ROLE_DESC_COUNSELING_STAFF = "심리상담 사무원 역할";

    public static final String TENANT_ROLE_DESC_ACADEMY_DIRECTOR = "학원 원장 역할";
    public static final String TENANT_ROLE_LABEL_TEACHER = "강사";
    public static final String TENANT_ROLE_DESC_ACADEMY_TEACHER = "강사 역할";
    public static final String TENANT_ROLE_LABEL_STUDENT = "학생";
    public static final String TENANT_ROLE_DESC_ACADEMY_STUDENT = "학생 역할";
    public static final String TENANT_ROLE_LABEL_PARENT = "학부모";
    public static final String TENANT_ROLE_DESC_ACADEMY_PARENT = "학부모 역할 (학원 전용)";
    public static final String TENANT_ROLE_LABEL_ADMIN_STAFF = "행정직원";
    public static final String TENANT_ROLE_DESC_ACADEMY_ADMIN_STAFF = "행정직원 역할";

    public static final String TENANT_ROLE_LABEL_CEO = "사장";
    public static final String TENANT_ROLE_DESC_FOOD_SERVICE_CEO = "요식업 사장 역할";
    public static final String TENANT_ROLE_LABEL_CHEF = "요리사";
    public static final String TENANT_ROLE_DESC_FOOD_SERVICE_CHEF = "요리사 역할";
    public static final String TENANT_ROLE_LABEL_CUSTOMER = "고객";
    public static final String TENANT_ROLE_DESC_FOOD_SERVICE_CUSTOMER = "고객 역할";
    public static final String TENANT_ROLE_LABEL_EMPLOYEE = "직원";
    public static final String TENANT_ROLE_DESC_FOOD_SERVICE_EMPLOYEE = "직원 역할";

    public static final String TENANT_ROLE_LABEL_TAEKWONDO_DIRECTOR = "관장";
    public static final String TENANT_ROLE_DESC_TAEKWONDO_DIRECTOR = "태권도 관장 역할";
    public static final String TENANT_ROLE_JSON_TAEKWONDO_ADMIN =
            "{\"isAdmin\": true, \"roleType\": \"ADMIN\", \"isDefault\": true, \"businessType\": \"TAEKWONDO\"}";
    public static final int TENANT_ROLE_SORT_FIRST = 1;
    public static final int TENANT_ROLE_SORT_SECOND = 2;
    public static final int TENANT_ROLE_SORT_THIRD = 3;
    public static final int TENANT_ROLE_SORT_FOURTH = 4;
    public static final int TENANT_ROLE_SORT_FIFTH = 5;

    // --- 온보딩 checklist_json / 초기화 상태 JSON (OnboardingServiceImpl 2차 슬라이스) ---

    public static final String CHECKLIST_JSON_KEY_REGION = "region";
    /** checklist_json 최상위 regionCode (우선순위 1) */
    public static final String CHECKLIST_JSON_KEY_REGION_CODE = "regionCode";
    public static final String CHECKLIST_JSON_KEY_ADDRESS = "address";
    public static final String CHECKLIST_JSON_KEY_POSTAL_CODE = "postalCode";
    public static final String CHECKLIST_JSON_KEY_BRAND_NAME = "brandName";

    public static final String INIT_STATUS_JSON_KEY_COMMON_CODES = "commonCodes";
    public static final String INIT_STATUS_JSON_KEY_ROLE_CODES = "roleCodes";
    public static final String INIT_STATUS_JSON_KEY_PERMISSION_GROUPS = "permissionGroups";
    public static final String INIT_STATUS_JSON_KEY_ERP_ACCOUNTS = "erpAccounts";
    public static final String INIT_STATUS_JSON_KEY_CREATED_AT = "createdAt";
    public static final String INIT_STATUS_JSON_KEY_UPDATED_AT = "updatedAt";
    public static final String INIT_STATUS_JSON_KEY_PHASE = "phase";
    public static final String INIT_STATUS_JSON_KEY_FALLBACK_USED = "fallbackUsed";
    public static final String INIT_STATUS_JSON_KEY_TENANT_ID = "tenantId";

    public static final String INIT_STATUS_OBJ_KEY_STATUS = "status";
    public static final String INIT_STATUS_OBJ_KEY_ERROR_MESSAGE = "errorMessage";

    public static final String PHASE_TENANT_INITIALIZATION = "TENANT_INITIALIZATION";
    public static final String PHASE_POST_APPROVAL_INITIALIZATION = "POST_APPROVAL_INITIALIZATION";
    public static final String PHASE_POST_APPROVAL_INITIALIZATION_ERROR = "POST_APPROVAL_INITIALIZATION_ERROR";
    public static final String PHASE_REAPPROVAL_INITIALIZATION = "REAPPROVAL_INITIALIZATION";
    public static final String PHASE_REAPPROVAL_INITIALIZATION_ERROR = "REAPPROVAL_INITIALIZATION_ERROR";

    public static final String ERROR_MESSAGE_UNKNOWN = "알 수 없는 오류";
    public static final String ERROR_MESSAGE_BRANDING_SAVE_FAILED = "브랜딩 정보 저장 중 오류가 발생했습니다";

    public static final String FALLBACK_DETECT_SUBSTRING_EN = "fallback";
    public static final String FALLBACK_DETECT_SUBSTRING_KO = "폴백";

    public static final String COMMON_CODE_CACHE_KEY_SEPARATOR = ":";

    public static final String POSTAL_CODE_NON_DIGIT_STRIP_PATTERN = "[^0-9]";
    public static final int POSTAL_CODE_PREFIX_MIN_LENGTH = 2;
    public static final int POSTAL_CODE_PREFIX_SUBSTRING_LENGTH = 2;

    public static final int POSTAL_PREFIX_NUM_SEOUL_MIN = 1;
    public static final int POSTAL_PREFIX_NUM_SEOUL_MAX = 13;
    public static final int POSTAL_PREFIX_NUM_BUSAN_MIN = 48;
    public static final int POSTAL_PREFIX_NUM_BUSAN_MAX = 49;
    public static final int POSTAL_PREFIX_NUM_DAEGU_MIN = 42;
    public static final int POSTAL_PREFIX_NUM_DAEGU_MAX = 43;
    public static final int POSTAL_PREFIX_NUM_INCHEON_MIN = 22;
    public static final int POSTAL_PREFIX_NUM_INCHEON_MAX = 23;
    public static final int POSTAL_PREFIX_NUM_GWANGJU_MIN = 61;
    public static final int POSTAL_PREFIX_NUM_GWANGJU_MAX = 62;
    public static final int POSTAL_PREFIX_NUM_DAEJEON_MIN = 30;
    public static final int POSTAL_PREFIX_NUM_DAEJEON_MAX = 34;
    public static final int POSTAL_PREFIX_NUM_ULSAN_MIN = 44;
    public static final int POSTAL_PREFIX_NUM_ULSAN_MAX = 45;
    public static final int POSTAL_PREFIX_NUM_SEJONG = 30;
    public static final int POSTAL_PREFIX_NUM_GYEONGGI_MIN_A = 10;
    public static final int POSTAL_PREFIX_NUM_GYEONGGI_MAX_A = 20;
    public static final int POSTAL_PREFIX_NUM_GYEONGGI_MIN_B = 40;
    public static final int POSTAL_PREFIX_NUM_GYEONGGI_MAX_B = 47;
    public static final int POSTAL_PREFIX_NUM_GANGWON_MIN = 24;
    public static final int POSTAL_PREFIX_NUM_GANGWON_MAX = 25;
    public static final int POSTAL_PREFIX_NUM_CHUNGBUK_MIN = 28;
    public static final int POSTAL_PREFIX_NUM_CHUNGBUK_MAX = 29;
    public static final int POSTAL_PREFIX_NUM_CHUNGNAM_MIN = 31;
    public static final int POSTAL_PREFIX_NUM_CHUNGNAM_MAX = 32;
    public static final int POSTAL_PREFIX_NUM_JEONBUK_MIN = 54;
    public static final int POSTAL_PREFIX_NUM_JEONBUK_MAX = 56;
    public static final int POSTAL_PREFIX_NUM_JEONNAM_MIN = 57;
    public static final int POSTAL_PREFIX_NUM_JEONNAM_MAX = 59;
    public static final int POSTAL_PREFIX_NUM_GYEONGBUK_MIN = 36;
    public static final int POSTAL_PREFIX_NUM_GYEONGBUK_MAX = 39;
    public static final int POSTAL_PREFIX_NUM_GYEONGNAM_MIN = 50;
    public static final int POSTAL_PREFIX_NUM_GYEONGNAM_MAX = 53;
    public static final int POSTAL_PREFIX_NUM_JEJU_MIN = 63;
    public static final int POSTAL_PREFIX_NUM_JEJU_MAX = 64;

    public static final String REGION_CODE_SEOUL = "seoul";
    public static final String REGION_CODE_BUSAN = "busan";
    public static final String REGION_CODE_INCHEON = "incheon";
    public static final String REGION_CODE_DAEGU = "daegu";
    public static final String REGION_CODE_DAEJEON = "daejeon";
    public static final String REGION_CODE_GWANGJU = "gwangju";
    public static final String REGION_CODE_ULSAN = "ulsan";
    public static final String REGION_CODE_SEJONG = "sejong";
    public static final String REGION_CODE_GYEONGGI = "gyeonggi";
    public static final String REGION_CODE_GANGWON = "gangwon";
    public static final String REGION_CODE_CHUNGBUK = "chungbuk";
    public static final String REGION_CODE_CHUNGNAM = "chungnam";
    public static final String REGION_CODE_JEONBUK = "jeonbuk";
    public static final String REGION_CODE_JEONNAM = "jeonnam";
    public static final String REGION_CODE_GYEONGBUK = "gyeongbuk";
    public static final String REGION_CODE_GYEONGNAM = "gyeongnam";
    public static final String REGION_CODE_JEJU = "jeju";
    public static final String REGION_CODE_TOKYO = "tokyo";
    public static final String REGION_CODE_OSAKA = "osaka";
    public static final String REGION_CODE_NEWYORK = "newyork";
    public static final String REGION_CODE_LOSANGELES = "losangeles";
    public static final String REGION_CODE_LONDON = "london";
    public static final String REGION_CODE_PARIS = "paris";
    public static final String REGION_CODE_SINGAPORE = "singapore";
    public static final String REGION_CODE_HONGKONG = "hongkong";
    public static final String REGION_CODE_BEIJING = "beijing";
    public static final String REGION_CODE_SHANGHAI = "shanghai";
    public static final String REGION_CODE_SYDNEY = "sydney";
    public static final String REGION_CODE_MELBOURNE = "melbourne";
    public static final String REGION_CODE_JAPAN = "japan";
    public static final String REGION_CODE_USA = "usa";
    public static final String REGION_CODE_UK = "uk";
    public static final String REGION_CODE_FRANCE = "france";
    public static final String REGION_CODE_CHINA = "china";
    public static final String REGION_CODE_AUSTRALIA = "australia";

    public static final String ADDRESS_TOKEN_SEOUL_KO = "서울";
    public static final String ADDRESS_TOKEN_SEOUL_EN = "seoul";
    public static final String ADDRESS_TOKEN_BUSAN_KO = "부산";
    public static final String ADDRESS_TOKEN_BUSAN_EN = "busan";
    public static final String ADDRESS_TOKEN_INCHEON_KO = "인천";
    public static final String ADDRESS_TOKEN_INCHEON_EN = "incheon";
    public static final String ADDRESS_TOKEN_DAEGU_KO = "대구";
    public static final String ADDRESS_TOKEN_DAEGU_EN = "daegu";
    public static final String ADDRESS_TOKEN_DAEJEON_KO = "대전";
    public static final String ADDRESS_TOKEN_DAEJEON_EN = "daejeon";
    public static final String ADDRESS_TOKEN_GWANGJU_KO = "광주";
    public static final String ADDRESS_TOKEN_GWANGJU_EN = "gwangju";
    public static final String ADDRESS_TOKEN_ULSAN_KO = "울산";
    public static final String ADDRESS_TOKEN_ULSAN_EN = "ulsan";
    public static final String ADDRESS_TOKEN_SEJONG_KO = "세종";
    public static final String ADDRESS_TOKEN_SEJONG_EN = "sejong";
    public static final String ADDRESS_TOKEN_GYEONGGI_KO = "경기";
    public static final String ADDRESS_TOKEN_GYEONGGI_EN = "gyeonggi";
    public static final String ADDRESS_TOKEN_GANGWON_KO = "강원";
    public static final String ADDRESS_TOKEN_GANGWON_EN = "gangwon";
    public static final String ADDRESS_TOKEN_CHUNGBUK_KO = "충북";
    public static final String ADDRESS_TOKEN_CHUNGBUK_EN = "chungbuk";
    public static final String ADDRESS_TOKEN_CHUNGNAM_KO = "충남";
    public static final String ADDRESS_TOKEN_CHUNGNAM_EN = "chungnam";
    public static final String ADDRESS_TOKEN_JEONBUK_KO = "전북";
    public static final String ADDRESS_TOKEN_JEONBUK_EN = "jeonbuk";
    public static final String ADDRESS_TOKEN_JEONNAM_KO = "전남";
    public static final String ADDRESS_TOKEN_JEONNAM_EN = "jeonnam";
    public static final String ADDRESS_TOKEN_GYEONGBUK_KO = "경북";
    public static final String ADDRESS_TOKEN_GYEONGBUK_EN = "gyeongbuk";
    public static final String ADDRESS_TOKEN_GYEONGNAM_KO = "경남";
    public static final String ADDRESS_TOKEN_GYEONGNAM_EN = "gyeongnam";
    public static final String ADDRESS_TOKEN_JEJU_KO = "제주";
    public static final String ADDRESS_TOKEN_JEJU_EN = "jeju";
    public static final String ADDRESS_TOKEN_TOKYO_EN = "tokyo";
    public static final String ADDRESS_TOKEN_TOKYO_KO = "도쿄";
    public static final String ADDRESS_TOKEN_OSAKA_EN = "osaka";
    public static final String ADDRESS_TOKEN_OSAKA_KO = "오사카";
    public static final String ADDRESS_TOKEN_NEW_YORK_EN = "new york";
    public static final String ADDRESS_TOKEN_NEW_YORK_KO = "뉴욕";
    public static final String ADDRESS_TOKEN_LOS_ANGELES_EN = "los angeles";
    public static final String ADDRESS_TOKEN_LOS_ANGELES_ABBR_EN = "la";
    public static final String ADDRESS_TOKEN_LOS_ANGELES_KO = "로스앤젤레스";
    public static final String ADDRESS_TOKEN_LONDON_EN = "london";
    public static final String ADDRESS_TOKEN_LONDON_KO = "런던";
    public static final String ADDRESS_TOKEN_PARIS_EN = "paris";
    public static final String ADDRESS_TOKEN_PARIS_KO = "파리";
    public static final String ADDRESS_TOKEN_SINGAPORE_EN = "singapore";
    public static final String ADDRESS_TOKEN_SINGAPORE_KO = "싱가포르";
    public static final String ADDRESS_TOKEN_HONG_KONG_EN = "hong kong";
    public static final String ADDRESS_TOKEN_HONG_KONG_KO = "홍콩";
    public static final String ADDRESS_TOKEN_BEIJING_EN = "beijing";
    public static final String ADDRESS_TOKEN_BEIJING_KO_A = "베이징";
    public static final String ADDRESS_TOKEN_BEIJING_KO_B = "북경";
    public static final String ADDRESS_TOKEN_SHANGHAI_EN = "shanghai";
    public static final String ADDRESS_TOKEN_SHANGHAI_KO = "상하이";
    public static final String ADDRESS_TOKEN_SYDNEY_EN = "sydney";
    public static final String ADDRESS_TOKEN_SYDNEY_KO = "시드니";
    public static final String ADDRESS_TOKEN_MELBOURNE_EN = "melbourne";
    public static final String ADDRESS_TOKEN_MELBOURNE_KO = "멜버른";
    public static final String ADDRESS_TOKEN_JAPAN_EN = "japan";
    public static final String ADDRESS_TOKEN_JAPAN_KO = "일본";
    public static final String ADDRESS_TOKEN_USA_EN = "usa";
    public static final String ADDRESS_TOKEN_UNITED_STATES_EN = "united states";
    public static final String ADDRESS_TOKEN_USA_KO = "미국";
    public static final String ADDRESS_TOKEN_UK_EN = "uk";
    public static final String ADDRESS_TOKEN_UNITED_KINGDOM_EN = "united kingdom";
    public static final String ADDRESS_TOKEN_UK_KO = "영국";
    public static final String ADDRESS_TOKEN_FRANCE_EN = "france";
    public static final String ADDRESS_TOKEN_FRANCE_KO = "프랑스";
    public static final String ADDRESS_TOKEN_CHINA_EN = "china";
    public static final String ADDRESS_TOKEN_CHINA_KO = "중국";
    public static final String ADDRESS_TOKEN_AUSTRALIA_EN = "australia";
    public static final String ADDRESS_TOKEN_AUSTRALIA_KO_A = "호주";
    public static final String ADDRESS_TOKEN_AUSTRALIA_KO_B = "오스트레일리아";

    public static final String LOG_WARN_REGION_CODE_EXTRACT_FAILED =
            "지역 코드 추출 실패: requestId={}, error={}";
    public static final String LOG_INFO_COMMON_CODES_INSERT_OK = "✅ 공통코드 삽입 성공: tenantId={}";
    public static final String LOG_ERROR_COMMON_CODES_INSERT_FAIL_CONTINUE =
            "공통코드 삽입 실패 (계속 진행): tenantId={}, error={}";
    public static final String LOG_INFO_ROLE_CODES_CREATE_OK = "✅ 역할 코드 생성 성공: tenantId={}";
    public static final String LOG_ERROR_ROLE_CODES_CREATE_FAIL_CONTINUE =
            "역할 코드 생성 실패 (계속 진행): tenantId={}, error={}";
    public static final String LOG_INFO_PERMISSION_GROUPS_ASSIGN_OK =
            "✅ 권한 그룹 할당 성공: tenantId={}";
    public static final String LOG_ERROR_PERMISSION_GROUPS_ASSIGN_FAIL_CONTINUE =
            "권한 그룹 할당 실패 (계속 진행): tenantId={}, error={}";
    public static final String LOG_INFO_ERP_ACCOUNT_SEED_OK = "✅ ERP 계정 매핑 시딩 성공: tenantId={}";
    public static final String LOG_ERROR_ERP_ACCOUNT_SEED_FAIL_CONTINUE =
            "ERP 계정 매핑 시딩 실패 (계속 진행): tenantId={}, error={}";
    public static final String LOG_INFO_INIT_STATUS_JSON_READY = "✅ 초기화 작업 상태 생성 완료: requestId={}";
    public static final String LOG_INFO_TENANT_INIT_AFTER_ONBOARDING_OK =
            "✅ 온보딩 후 테넌트 초기화 완료: tenantId={}";
    public static final String LOG_WARN_INIT_STATUS_JSON_BUILD_FAIL_IGNORE =
            "초기화 작업 상태 JSON 생성 실패 (무시): requestId={}, error={}";
    public static final String LOG_WARN_INIT_STATUS_AFTER_DECISION_SAVE_FAIL_IGNORE =
            "결정 후 초기화 상태 저장 실패(무시): requestId={}, tenantId={}, error={}";
    public static final String LOG_WARN_EXISTING_INIT_STATUS_JSON_PARSE_FAIL =
            "기존 초기화 상태 JSON 파싱 실패, 최소 상태로 대체: requestId={}, error={}";
    public static final String LOG_WARN_INIT_STATUS_JSON_SERIALIZE_FAIL =
            "초기화 상태 JSON 직렬화 실패: requestId={}, error={}";
    public static final String LOG_ERROR_POST_APPROVAL_INIT_BG_FAIL =
            "온보딩 사후 초기화 백그라운드 실행 실패: requestId={}, error={}";
    public static final String LOG_DEBUG_NO_ACTIVE_TX_POST_APPROVAL_SYNC =
            "활성 트랜잭션 없음 — 사후 초기화 동기 실행: requestId={}";
    public static final String LOG_ERROR_POST_APPROVAL_INIT_SYNC_FAIL =
            "온보딩 사후 초기화 동기 실행 실패: requestId={}, error={}";
    public static final String LOG_INFO_POST_APPROVAL_INIT_START =
            "🔄 테넌트 사후 초기화 시작: tenantId={}, requestId={}, reapprovalFlow={}";
    public static final String LOG_INFO_POST_APPROVAL_STATUS_SAVED = "✅ 사후 초기화 상태 저장 완료: requestId={}";
    public static final String LOG_WARN_BRAND_NAME_SET_FAIL_POST =
            "브랜드명 설정 실패 (사후 초기화): tenantId={}, error={}";
    public static final String LOG_WARN_ONBOARDING_APPROVAL_EMAIL_SKIPPED =
            "온보딩 요청 재조회 실패로 승인 메일 생략: requestId={}";
    public static final String LOG_ERROR_TENANT_INIT_AFTER_ONBOARDING_FAIL_POST =
            "온보딩 후 테넌트 초기화 실패 (사후): tenantId={}, requestId={}, error={}";
    public static final String LOG_ERROR_COMMON_CODES_INSERT_TX_COMMIT =
            "공통코드 삽입 실패 (트랜잭션은 커밋): tenantId={}, error={}";
    public static final String LOG_ERROR_ROLE_CODES_CREATE_TX_COMMIT =
            "역할 코드 생성 실패 (트랜잭션은 커밋): tenantId={}, error={}";
    public static final String LOG_INFO_PERMISSION_GROUPS_ASSIGN_DONE =
            "✅ 권한 그룹 할당 완료: tenantId={}";
    public static final String LOG_ERROR_PERMISSION_GROUPS_ASSIGN_TX_COMMIT =
            "권한 그룹 할당 실패 (트랜잭션은 커밋): tenantId={}, error={}";
    public static final String LOG_WARN_TENANT_ID_EMPTY_SKIP_BRANDING =
            "⚠️ 테넌트 ID가 없어 브랜딩 정보 설정을 건너뜁니다.";
    public static final String LOG_WARN_TENANT_NOT_FOUND_SKIP_BRANDING =
            "⚠️ 테넌트를 찾을 수 없어 브랜딩 정보 설정을 건너뜁니다: tenantId={}";
    public static final String LOG_WARN_CHECKLIST_JSON_PARSE_BRAND_FAIL =
            "checklistJson 파싱 실패 (브랜드명 추출 실패): tenantId={}, error={}";
    public static final String LOG_WARN_BRANDING_JSON_PARSE_FALLBACK =
            "기존 branding_json 파싱 실패, 기본값으로 재생성: tenantId={}, error={}";
    public static final String LOG_INFO_TENANT_BRANDING_SET_OK =
            "✅ 테넌트 브랜딩 정보 설정 완료: tenantId={}, brandName={}";
    public static final String LOG_ERROR_BRANDING_JSON_SERIALIZE_FAIL =
            "❌ 브랜딩 정보 JSON 변환 실패: tenantId={}, error={}";
    public static final String LOG_ERROR_TENANT_BRANDING_SET_FAIL =
            "❌ 테넌트 브랜딩 정보 설정 실패: tenantId={}, error={}";
    public static final String LOG_INFO_DEFAULT_TENANT_COMMON_CODES_BATCH_START =
            "🔄 기본 테넌트 공통코드 추가 시작 (배치 처리): tenantId={}";
    public static final String LOG_DEBUG_EXISTING_COMMON_CODE_COUNT =
            "기존 공통코드 개수: {}, tenantId={}";

    // 메시지 포맷팅 헬퍼 메서드
    public static String formatError(String template, Object... args) {
        return MessageFormat.format(template, args);
    }
    
    // 생성자 방지
    private OnboardingConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}

