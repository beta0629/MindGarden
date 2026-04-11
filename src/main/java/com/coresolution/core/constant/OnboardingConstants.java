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
    
    // 메시지 포맷팅 헬퍼 메서드
    public static String formatError(String template, Object... args) {
        return MessageFormat.format(template, args);
    }
    
    // 생성자 방지
    private OnboardingConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}

