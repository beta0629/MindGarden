package com.coresolution.core.security;

/**
 * 보안 이벤트 타입 열거형
 * 시스템에서 발생할 수 있는 다양한 보안 이벤트 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
public enum SecurityEventType {
    
    // 인증 관련 이벤트
    LOGIN_SUCCESS("로그인 성공", SecuritySeverity.INFO),
    LOGIN_FAILURE("로그인 실패", SecuritySeverity.WARNING),
    MULTIPLE_LOGIN_FAILURES("다중 로그인 실패", SecuritySeverity.HIGH),
    ACCOUNT_LOCKED("계정 잠금", SecuritySeverity.HIGH),
    PASSWORD_CHANGE("비밀번호 변경", SecuritySeverity.INFO),
    UNAUTHORIZED_ACCESS_ATTEMPT("무권한 접근 시도", SecuritySeverity.HIGH),
    
    // 세션 관련 이벤트
    SESSION_CREATED("세션 생성", SecuritySeverity.INFO),
    SESSION_EXPIRED("세션 만료", SecuritySeverity.INFO),
    SESSION_HIJACK_ATTEMPT("세션 하이재킹 시도", SecuritySeverity.CRITICAL),
    CONCURRENT_SESSION_DETECTED("동시 세션 감지", SecuritySeverity.WARNING),
    
    // 공격 시도 이벤트
    SQL_INJECTION_ATTEMPT("SQL 인젝션 시도", SecuritySeverity.CRITICAL),
    XSS_ATTEMPT("XSS 공격 시도", SecuritySeverity.HIGH),
    CSRF_ATTEMPT("CSRF 공격 시도", SecuritySeverity.HIGH),
    PATH_TRAVERSAL_ATTEMPT("경로 순회 공격 시도", SecuritySeverity.HIGH),
    BRUTE_FORCE_ATTACK("무차별 대입 공격", SecuritySeverity.CRITICAL),
    
    // 데이터 접근 이벤트
    SENSITIVE_DATA_ACCESS("민감 데이터 접근", SecuritySeverity.WARNING),
    DATA_EXPORT("데이터 내보내기", SecuritySeverity.WARNING),
    UNAUTHORIZED_DATA_ACCESS("무권한 데이터 접근", SecuritySeverity.HIGH),
    DATA_MODIFICATION("데이터 수정", SecuritySeverity.INFO),
    DATA_DELETION("데이터 삭제", SecuritySeverity.WARNING),
    
    // 시스템 이벤트
    PRIVILEGE_ESCALATION_ATTEMPT("권한 상승 시도", SecuritySeverity.CRITICAL),
    ADMIN_ACTION("관리자 작업", SecuritySeverity.INFO),
    SYSTEM_CONFIG_CHANGE("시스템 설정 변경", SecuritySeverity.WARNING),
    FILE_UPLOAD("파일 업로드", SecuritySeverity.INFO),
    MALICIOUS_FILE_UPLOAD("악성 파일 업로드 시도", SecuritySeverity.CRITICAL),
    
    // 네트워크 이벤트
    SUSPICIOUS_ACTIVITY("의심스러운 활동", SecuritySeverity.WARNING),
    ABNORMAL_REQUEST_PATTERN("비정상적인 요청 패턴", SecuritySeverity.WARNING),
    RATE_LIMIT_EXCEEDED("요청 한도 초과", SecuritySeverity.WARNING),
    IP_BLOCKED("IP 차단", SecuritySeverity.INFO),
    
    // API 보안 이벤트
    API_KEY_MISUSE("API 키 오남용", SecuritySeverity.HIGH),
    API_RATE_LIMIT_EXCEEDED("API 요청 한도 초과", SecuritySeverity.WARNING),
    INVALID_API_TOKEN("유효하지 않은 API 토큰", SecuritySeverity.WARNING),
    
    // 기타 보안 이벤트
    SECURITY_SCAN_DETECTED("보안 스캔 감지", SecuritySeverity.WARNING),
    VULNERABILITY_EXPLOIT_ATTEMPT("취약점 악용 시도", SecuritySeverity.CRITICAL),
    COMPLIANCE_VIOLATION("컴플라이언스 위반", SecuritySeverity.HIGH),
    AUDIT_LOG_TAMPERING("감사 로그 변조 시도", SecuritySeverity.CRITICAL);

    private final String description;
    private final SecuritySeverity severity;

    SecurityEventType(String description, SecuritySeverity severity) {
        this.description = description;
        this.severity = severity;
    }

    public String getDescription() {
        return description;
    }

    public SecuritySeverity getSeverity() {
        return severity;
    }

    /**
     * 심각도별 이벤트 필터링
     */
    public static SecurityEventType[] getBySeverity(SecuritySeverity severity) {
        return java.util.Arrays.stream(values())
            .filter(event -> event.getSeverity() == severity)
            .toArray(SecurityEventType[]::new);
    }

    /**
     * 공격 관련 이벤트 여부 확인
     */
    public boolean isAttackEvent() {
        return this == SQL_INJECTION_ATTEMPT ||
               this == XSS_ATTEMPT ||
               this == CSRF_ATTEMPT ||
               this == PATH_TRAVERSAL_ATTEMPT ||
               this == BRUTE_FORCE_ATTACK ||
               this == SESSION_HIJACK_ATTEMPT ||
               this == PRIVILEGE_ESCALATION_ATTEMPT ||
               this == MALICIOUS_FILE_UPLOAD ||
               this == VULNERABILITY_EXPLOIT_ATTEMPT;
    }

    /**
     * 인증 관련 이벤트 여부 확인
     */
    public boolean isAuthenticationEvent() {
        return this == LOGIN_SUCCESS ||
               this == LOGIN_FAILURE ||
               this == MULTIPLE_LOGIN_FAILURES ||
               this == ACCOUNT_LOCKED ||
               this == UNAUTHORIZED_ACCESS_ATTEMPT;
    }

    /**
     * 데이터 접근 관련 이벤트 여부 확인
     */
    public boolean isDataAccessEvent() {
        return this == SENSITIVE_DATA_ACCESS ||
               this == DATA_EXPORT ||
               this == UNAUTHORIZED_DATA_ACCESS ||
               this == DATA_MODIFICATION ||
               this == DATA_DELETION;
    }
}
