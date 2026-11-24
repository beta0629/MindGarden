package com.coresolution.consultation.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

/**
 * SMS 인증 설정 프로퍼티.
 * 비용 절약을 위해 사용 여부를 제어할 수 있도록 설계.
 *
 * <p>[2026-11-24 재학 결정] Spring active profile 에 {@code dev} 가 있으면
 * {@link #isTestMode()} 는 ENV/{@code testMode} 필드와 무관하게 항상 {@code true}
 * (개발 실발송 0건). 운영({@code prod}) 등은 필드·ENV 값 그대로.
 */
@Data
@Component
@ConfigurationProperties(prefix = "sms.auth")
public class SmsProperties {

    /** .dev 강제 테스트 모드용 Spring profile 이름 (허용 범위 설정 상수). */
    static final String DEV_PROFILE = "dev";

    /**
     * SMS 인증 사용 여부 (기본값: false - 비용 절약)
     */
    private boolean enabled = false;

    /**
     * SMS 제공업체 (nhn, twilio, aligo 등)
     */
    private String provider = "nhn";

    /**
     * API 키
     */
    private String apiKey;

    /**
     * API 시크릿
     */
    private String apiSecret;

    /**
     * 발신자 번호
     */
    private String senderNumber;

    /**
     * 테스트 모드 여부 (기본값: true - 실제 SMS 발송 안함)
     */
    private boolean testMode = true;

    /**
     * 테스트용 고정 인증번호
     */
    private String mockVerificationCode = "123456";

    /**
     * Spring Environment (선택). {@code new SmsProperties()} 단위 테스트에서는 null.
     */
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Environment environment;

    /**
     * Environment 주입. 단위 테스트에서 no-arg 생성 시 null 유지.
     *
     * @param environment Spring Environment
     */
    @Autowired(required = false)
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    /**
     * 테스트 모드 여부.
     *
     * <p>active profile 에 {@code dev} 가 있으면 ENV/{@code testMode}=false 여도 항상 true
     * (앱 fail-safe). Environment 가 null 이면 필드 {@code testMode} 만 사용.
     *
     * @return 테스트 모드이면 true (실발송 불가)
     */
    public boolean isTestMode() {
        if (environment != null && environment.acceptsProfiles(Profiles.of(DEV_PROFILE))) {
            return true;
        }
        return this.testMode;
    }

    /**
     * SMS 인증이 활성화되어 있고 실제 모드인지 확인
     *
     * @return 프로덕션(실발송) 모드 여부
     */
    public boolean isProductionMode() {
        return enabled && !isTestMode();
    }

    /**
     * SMS 인증이 사용 가능한지 확인 (테스트 모드 포함)
     *
     * @return 사용 가능 여부
     */
    public boolean isAvailable() {
        return enabled;
    }
}
