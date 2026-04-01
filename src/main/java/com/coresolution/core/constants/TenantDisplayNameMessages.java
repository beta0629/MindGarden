package com.coresolution.core.constants;

/**
 * 테넌트 표시명(display name, {@code tenants.name}) 변경 API 메시지 상수.
 * 사용자 노출·예외 메시지 문자열의 하드코딩 분산을 방지합니다.
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
public final class TenantDisplayNameMessages {

    private TenantDisplayNameMessages() {
    }

    /** 삭제되지 않은 테넌트를 찾지 못한 경우 */
    public static final String TENANT_NOT_FOUND = "테넌트를 찾을 수 없습니다.";

    /** 공백만 입력된 경우(트림 후 빈 문자열) */
    public static final String NAME_EMPTY_AFTER_TRIM = "테넌트명을 입력해 주세요.";

    /** 다른 테넌트가 동일 표시명을 사용 중인 경우 */
    public static final String DUPLICATE_NAME_IN_USE = "다른 테넌트에서 이미 사용 중인 테넌트명입니다.";
}
