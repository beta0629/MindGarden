package com.coresolution.core.tenant;

import java.time.ZoneId;

/**
 * 테넌트 종료 거부 코드·문구·감사 상수.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class TenantCloseMessages {

    /** 유예·종료 시각 기준 시간대. */
    public static final ZoneId ZONE_SEOUL = ZoneId.of("Asia/Seoul");

    public static final int REJECT_HTTP_STATUS = 409;

    public static final String CODE_STATUS_NOT_ALLOWED = "TENANT_CLOSE_STATUS_NOT_ALLOWED";
    public static final String MESSAGE_STATUS_NOT_ALLOWED = "정지 상태의 테넌트만 종료할 수 있습니다.";

    public static final String CODE_GRACE_NOT_ELAPSED = "TENANT_CLOSE_GRACE_NOT_ELAPSED";
    public static final String MESSAGE_GRACE_NOT_ELAPSED = "정지 후 유예 기간이 지나야 종료할 수 있습니다.";

    public static final String CODE_ACTIVE_SUBSCRIPTION = "TENANT_CLOSE_ACTIVE_SUBSCRIPTION";
    public static final String MESSAGE_ACTIVE_SUBSCRIPTION = "유효한 구독이 있어 종료할 수 없습니다.";

    public static final String CODE_SETTINGS_UNREADABLE = "TENANT_CLOSE_SETTINGS_UNREADABLE";
    public static final String MESSAGE_SETTINGS_UNREADABLE = "종료에 필요한 테넌트 설정을 읽지 못했습니다.";

    public static final String CODE_TENANT_NOT_FOUND = "TENANT_NOT_FOUND";
    public static final String MESSAGE_TENANT_NOT_FOUND = "테넌트를 찾을 수 없습니다.";

    /** 감사 로그 actor_role. */
    public static final String ACTOR_ROLE_OPS = "OPS";

    /** 인증 이름이 없을 때 closed_by 자리에 남기는 값. 컬럼 길이 이내. */
    public static final String ACTOR_UNKNOWN = "ops-unknown";

    /** closed_by 컬럼 길이. 컬럼 활성화 전과 감사 metadata 가 같은 상한을 쓴다. */
    public static final int CLOSED_BY_MAX_LENGTH = 100;

    public static final String ENTITY_TYPE_TENANT = "TENANT";

    public static final String SETTINGS_KEY_SUBDOMAIN = "subdomain";
    public static final String SETTINGS_KEY_DOMAIN = "domain";

    /** 목록 쿼리 파라미터 이름. */
    public static final String PARAM_INCLUDE_CLOSED = "includeClosed";

    private TenantCloseMessages() {
    }

    /**
     * @param decision 종료 판정
     * @return 응답 errorCode
     */
    public static String codeOf(TenantCloseDecision decision) {
        if (decision == TenantCloseDecision.GRACE_NOT_ELAPSED) {
            return CODE_GRACE_NOT_ELAPSED;
        }
        if (decision == TenantCloseDecision.ACTIVE_SUBSCRIPTION) {
            return CODE_ACTIVE_SUBSCRIPTION;
        }
        return CODE_STATUS_NOT_ALLOWED;
    }

    /**
     * @param decision 종료 판정
     * @return 사용자 문구
     */
    public static String messageOf(TenantCloseDecision decision) {
        if (decision == TenantCloseDecision.GRACE_NOT_ELAPSED) {
            return MESSAGE_GRACE_NOT_ELAPSED;
        }
        if (decision == TenantCloseDecision.ACTIVE_SUBSCRIPTION) {
            return MESSAGE_ACTIVE_SUBSCRIPTION;
        }
        return MESSAGE_STATUS_NOT_ALLOWED;
    }
}
