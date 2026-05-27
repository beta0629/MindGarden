package com.coresolution.consultation.constant;

/**
 * 통일 감사 로그({@code audit_logs.action}) 액션 enum.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §4 가 정의하는 lifecycle/anonymize/destruction/관리자
 * 액션 추적의 SSOT 라벨. 한국어 라벨은 {@link #getMessageKey()} 가 반환하는 i18n 키를 통해
 * 메시지 번들에서 분리 관리한다 (하드코딩 게이트 §17.1 정합).</p>
 *
 * <p>code 값은 Flyway V20260604_001 의 {@code audit_logs.action VARCHAR(60)} 컬럼에
 * 그대로 적재된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public enum AuditAction {

    USER_ANONYMIZE("USER_ANONYMIZE", "enums.AuditAction.USER_ANONYMIZE"),
    USER_DORMANT_TRANSITION("USER_DORMANT_TRANSITION", "enums.AuditAction.USER_DORMANT_TRANSITION"),
    USER_HARD_DELETE("USER_HARD_DELETE", "enums.AuditAction.USER_HARD_DELETE"),
    LIFECYCLE_STATE_CHANGE("LIFECYCLE_STATE_CHANGE", "enums.AuditAction.LIFECYCLE_STATE_CHANGE"),
    USER_WITHDRAWAL_REQUEST("USER_WITHDRAWAL_REQUEST", "enums.AuditAction.USER_WITHDRAWAL_REQUEST"),
    USER_WITHDRAWAL_CANCEL("USER_WITHDRAWAL_CANCEL", "enums.AuditAction.USER_WITHDRAWAL_CANCEL"),
    USER_RESTORE("USER_RESTORE", "enums.AuditAction.USER_RESTORE"),
    ADMIN_FORCE_DEACTIVATE("ADMIN_FORCE_DEACTIVATE", "enums.AuditAction.ADMIN_FORCE_DEACTIVATE"),
    /** 익명화 사전 통지 (30일 전 알림 발송 시점) — Phase 3 cron. */
    AUTO_ANONYMIZE_NOTIFIED("AUTO_ANONYMIZE_NOTIFIED", "enums.AuditAction.AUTO_ANONYMIZE_NOTIFIED"),
    /** 휴면 사전 통지 (30일 전 알림 발송 시점) — Phase 3 cron. */
    AUTO_DORMANT_NOTIFIED("AUTO_DORMANT_NOTIFIED", "enums.AuditAction.AUTO_DORMANT_NOTIFIED"),
    /** DORMANT vault → users PII 복원 (재로그인 시점) — Phase 3. */
    PII_VAULT_RESTORE("PII_VAULT_RESTORE", "enums.AuditAction.PII_VAULT_RESTORE"),
    /** Phase 2-β — 어드민 강제 종료 (ACTIVE → DELETED_BY_ADMIN, Q5 7일 윈도우 진입). */
    ADMIN_FORCED_DELETE("ADMIN_FORCED_DELETE", "enums.AuditAction.ADMIN_FORCED_DELETE"),
    /** Phase 2-β — 어드민 7일 윈도우 내 되돌리기 (DELETED_BY_ADMIN → ACTIVE). */
    ADMIN_RESTORE("ADMIN_RESTORE", "enums.AuditAction.ADMIN_RESTORE"),
    /** Phase 2-β — 어드민 강제 종료 7일 윈도우 만료 후 자동 익명화 (DELETED_BY_ADMIN → ANONYMIZED). */
    ADMIN_FORCED_DELETE_ANONYMIZED(
            "ADMIN_FORCED_DELETE_ANONYMIZED", "enums.AuditAction.ADMIN_FORCED_DELETE_ANONYMIZED");

    private final String code;
    private final String messageKey;

    AuditAction(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    /**
     * @return audit_logs.action 컬럼에 적재되는 코드 (예: USER_ANONYMIZE)
     */
    public String getCode() {
        return code;
    }

    /**
     * @return Spring MessageSource 가 한국어 라벨로 변환할 i18n 키 (예: enums.AuditAction.USER_ANONYMIZE)
     */
    public String getMessageKey() {
        return messageKey;
    }

    /**
     * 코드 문자열로 enum 을 찾는다.
     *
     * @param code audit_logs.action 코드 (예: USER_ANONYMIZE)
     * @return 매칭되는 enum
     * @throws IllegalArgumentException 알 수 없는 코드일 때
     */
    public static AuditAction fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("AuditAction code is null");
        }
        for (AuditAction value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown AuditAction code: " + code);
    }
}
