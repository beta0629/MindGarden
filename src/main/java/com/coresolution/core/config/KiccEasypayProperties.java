package com.coresolution.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Data;

/**
 * KICC 이지페이 온라인 API 호스트 기본값(배포 설정).
 * 테넌트 {@code settings_json} 으로 오버라이드 가능하며, 자바 비즈니스 로직에는 호스트 문자열을 두지 않는다.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
@Data
@ConfigurationProperties(prefix = "mindgarden.pg.kicc.easypay")
public class KiccEasypayProperties {

    /**
     * 테스트 PG API 호스트명(HTTPS, 호스트만). 환경 변수 {@code KICC_EASYPAY_HOST_TEST} 로 덮어쓸 수 있다.
     */
    private String hostTest = "";

    /**
     * 운영 PG API 호스트명(HTTPS, 호스트만). 환경 변수 {@code KICC_EASYPAY_HOST_PROD} 로 덮어쓸 수 있다.
     */
    private String hostProd = "";
}
