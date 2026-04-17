package com.coresolution.core.constants;

/**
 * {@code tenant_pg_configurations.settings_json} 에서 사용하는 키 이름.
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class TenantPgSettingsJsonKeys {

    /**
     * 포트원 V2 웹훅 서명용 시크릿. 값은 {@code secret_key_encrypted} 와 동일하게 암호문으로 저장하는 것을 권장한다.
     */
    public static final String PORTONE_WEBHOOK_SECRET = "portoneWebhookSecret";

    /**
     * KICC 이지페이 온라인 API 호스트(테스트). 값이 있으면 해당 호스트만 사용(HTTPS).
     */
    public static final String KICC_EASYPAY_API_HOST_TEST = "kiccEasypayApiHostTest";

    /**
     * KICC 이지페이 온라인 API 호스트(운영). 값이 있으면 해당 호스트만 사용(HTTPS).
     */
    public static final String KICC_EASYPAY_API_HOST_PROD = "kiccEasypayApiHostProd";

    private TenantPgSettingsJsonKeys() {
    }
}
