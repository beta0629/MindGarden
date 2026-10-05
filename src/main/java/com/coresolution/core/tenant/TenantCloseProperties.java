package com.coresolution.core.tenant;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 테넌트 종료 유예 설정.
 *
 * <p>{@code tenant.close.grace-days}. 환경 변수 {@code TENANT_CLOSE_GRACE_DAYS} 로 덮어쓴다.
 * 기본값은 {@link #DEFAULT_GRACE_DAYS} 일이다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ConfigurationProperties(prefix = "tenant.close")
public class TenantCloseProperties {

    /** 유예 기본 일수. */
    public static final int DEFAULT_GRACE_DAYS = 30;

    private int graceDays = DEFAULT_GRACE_DAYS;

    /**
     * @return 0 이상 유예 일수. 음수 설정은 기본값으로 되돌린다.
     */
    public int getGraceDays() {
        if (graceDays < 0) {
            return DEFAULT_GRACE_DAYS;
        }
        return graceDays;
    }

    /**
     * @param graceDays 유예 일수
     */
    public void setGraceDays(int graceDays) {
        this.graceDays = graceDays;
    }
}
