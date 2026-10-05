package com.coresolution.core.tenant;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 테넌트 종료 유예 설정.
 *
 * <p>{@code tenant.close.grace-days}. 환경 변수 {@code TENANT_CLOSE_GRACE_DAYS} 로 덮어쓴다.
 * 기본값은 {@link #DEFAULT_GRACE_DAYS} 일이다.</p>
 *
 * <p>{@code tenant.close.release-identity}. 환경 변수 {@code TENANT_CLOSE_RELEASE_IDENTITY}.
 * 기본값은 꺼짐이다. 켜면 subdomain 을 비우고 {@code settings_json} 의 subdomain·domain 을 지운다.
 * previous_subdomain·previous_domain 컬럼 매핑 이후에만 켠다.</p>
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
     * 마이그레이션 후 활성화. 기본 꺼짐.
     * 켜면 subdomain·settings_json 의 subdomain/domain 을 비운다.
     */
    private boolean releaseIdentity = false;

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

    /**
     * @return 식별자 해제를 수행하면 true
     */
    public boolean isReleaseIdentity() {
        return releaseIdentity;
    }

    /**
     * @param releaseIdentity 마이그레이션 후 식별자 해제
     */
    public void setReleaseIdentity(boolean releaseIdentity) {
        this.releaseIdentity = releaseIdentity;
    }
}
