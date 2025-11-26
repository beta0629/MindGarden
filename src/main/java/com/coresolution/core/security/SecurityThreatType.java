package com.coresolution.core.security;

/**
 * 보안 위협 타입 열거형
 * 시스템에서 탐지할 수 있는 보안 위협 유형 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
public enum SecurityThreatType {
    
    SQL_INJECTION("SQL 인젝션", "데이터베이스 조작을 시도하는 공격"),
    XSS("크로스 사이트 스크립팅", "악성 스크립트 삽입 공격"),
    CSRF("크로스 사이트 요청 위조", "사용자 권한을 악용한 요청 위조"),
    PATH_TRAVERSAL("경로 순회", "시스템 파일 접근을 시도하는 공격"),
    BRUTE_FORCE("무차별 대입", "비밀번호를 추측하는 공격"),
    SESSION_HIJACKING("세션 하이재킹", "세션을 탈취하여 사용자 권한 획득"),
    PRIVILEGE_ESCALATION("권한 상승", "더 높은 권한을 획득하려는 시도"),
    MALICIOUS_FILE("악성 파일", "악성 코드가 포함된 파일 업로드"),
    SUSPICIOUS_IP("의심스러운 IP", "알려진 악성 IP 또는 비정상적 활동 IP"),
    ABNORMAL_PATTERN("비정상 패턴", "일반적이지 않은 요청 패턴"),
    RATE_LIMIT_ABUSE("요청 한도 남용", "비정상적으로 많은 요청 발생"),
    DATA_EXFILTRATION("데이터 유출", "민감한 데이터의 무단 접근 또는 추출"),
    VULNERABILITY_EXPLOIT("취약점 악용", "알려진 취약점을 악용한 공격"),
    SOCIAL_ENGINEERING("사회공학", "인간의 심리를 악용한 공격"),
    PHISHING("피싱", "가짜 사이트나 이메일을 통한 정보 탈취");

    private final String displayName;
    private final String description;

    SecurityThreatType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 위협 심각도 반환
     */
    public SecuritySeverity getSeverity() {
        return switch (this) {
            case SQL_INJECTION, SESSION_HIJACKING, PRIVILEGE_ESCALATION, 
                 MALICIOUS_FILE, VULNERABILITY_EXPLOIT -> SecuritySeverity.CRITICAL;
            case XSS, CSRF, PATH_TRAVERSAL, BRUTE_FORCE, 
                 DATA_EXFILTRATION, PHISHING -> SecuritySeverity.HIGH;
            case SUSPICIOUS_IP, ABNORMAL_PATTERN, RATE_LIMIT_ABUSE, 
                 SOCIAL_ENGINEERING -> SecuritySeverity.WARNING;
        };
    }

    /**
     * 자동 차단 대상 여부
     */
    public boolean shouldAutoBlock() {
        return this == SQL_INJECTION ||
               this == BRUTE_FORCE ||
               this == MALICIOUS_FILE ||
               this == VULNERABILITY_EXPLOIT;
    }

    /**
     * 즉시 알림 필요 여부
     */
    public boolean requiresImmediateAlert() {
        return getSeverity() == SecuritySeverity.CRITICAL;
    }

    /**
     * 로그 보존 기간 (일)
     */
    public int getLogRetentionDays() {
        return switch (getSeverity()) {
            case CRITICAL -> 365;  // 1년
            case HIGH -> 180;      // 6개월
            case WARNING -> 90;    // 3개월
            case INFO -> 30;       // 1개월
        };
    }
}
