package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

/**
 * MindGarden 공개 API·계정 연동 관련 보안 설정.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@Data
@Component
@ConfigurationProperties(prefix = "mindgarden.security")
public class MindgardenSecurityProperties {

    /**
     * 계정 연동(이메일 인증 발송 등) 제한
     */
    private AccountIntegration accountIntegration = new AccountIntegration();

    /**
     * 앱 레이어 IP 기준 레이트리밋
     */
    private RateLimit rateLimit = new RateLimit();

    @Data
    public static class AccountIntegration {

        /**
         * 동일 이메일로 인증 메일을 다시 보내기 전 최소 대기 시간(초)
         */
        private int emailVerificationCooldownSeconds = 60;

        /**
         * 동일 이메일당 하루(서버 {@link java.time.LocalDate}, 시스템 타임존) 최대 발송 성공 횟수
         */
        private int emailVerificationDailyLimit = 10;
    }

    @Data
    public static class RateLimit {

        /**
         * {@link #integrationPathPrefix} 하위 공개 POST 등에 대한 IP당 분당 허용 요청 수
         */
        private int integrationRequestsPerMinute = 20;

        /**
         * 민감 경로(계정 연동 공개 API) URI 접두사
         */
        private String integrationPathPrefix = "/api/v1/accounts/integration/";

        /**
         * Trinity 공개 온보딩 생성({@link #onboardingCreatePath}) POST에 대한 IP당 분당 허용 요청 수.
         * {@code /api/v1/ops/onboarding/requests} 등 운영자 경로에는 적용하지 않는다.
         */
        private int onboardingCreateRequestsPerMinute = 5;

        /**
         * 레이트리밋 대상 공개 온보딩 생성 URI({@code HttpServletRequest#getRequestURI()} 와 정확히 일치).
         * 컨텍스트 경로를 쓰는 배포에서는 전체 URI에 맞게 설정한다.
         */
        private String onboardingCreatePath = "/api/v1/onboarding/requests";
    }
}
