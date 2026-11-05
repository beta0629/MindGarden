package com.coresolution.consultation.constant;

/**
 * 회기 승계·이관 이력(표시 전용) 상수.
 *
 * <p>이벤트는 만들지 않고 {@code audit_logs} / {@code consultant_client_mapping_history} /
 * 매핑 notes 에 이미 있는 기록만 읽는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class SessionTransferHistoryConstants {

    private SessionTransferHistoryConstants() {
    }

    public static final String VERB_SUCCESSION = "승계";
    public static final String VERB_TRANSFER = "이관";
    public static final String HEADLINE_FMT = "%s → %s: %d회 %s";
    public static final String UNKNOWN_NAME = "알 수 없음";

    public static final String RECORD_SOURCE_AUDIT_LOG = "AUDIT_LOG";
    public static final String RECORD_SOURCE_MAPPING_HISTORY = "MAPPING_HISTORY";
    public static final String RECORD_SOURCE_MAPPING_NOTE = "MAPPING_NOTE";

    public static final String DIRECTION_OUTGOING = "OUTGOING";
    public static final String DIRECTION_INCOMING = "INCOMING";

    public static final String META_SOURCE_MAPPING_ID = "sourceMappingId";
    public static final String META_TARGET_MAPPING_ID = "targetMappingId";
    public static final String META_SESSION_COUNT = "sessionCount";
    public static final String META_SOURCE_CLIENT_ID = "sourceClientId";
    public static final String META_TARGET_CLIENT_ID = "targetClientId";
    public static final String META_SOURCE_CONSULTANT_ID = "sourceConsultantId";
    public static final String META_TARGET_CONSULTANT_ID = "targetConsultantId";
    public static final String META_REASON = "reason";

    public static final String MSG_CLIENT_ID_REQUIRED = "clientId는 필수입니다.";
    public static final String MSG_MAPPING_ID_REQUIRED = "mappingId는 필수입니다.";
    public static final String MSG_MAPPING_NOT_FOUND = "매핑을 찾을 수 없습니다.";
    public static final String MSG_TENANT_REQUIRED = "tenantId가 설정되지 않았습니다.";
}
