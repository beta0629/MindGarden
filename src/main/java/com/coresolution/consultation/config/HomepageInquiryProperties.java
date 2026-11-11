package com.coresolution.consultation.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;
import lombok.Getter;
import lombok.Setter;

/**
 * 홈페이지 공개 문의·공개 홈 CORS·전용 Turnstile 설정.
 *
 * <p>{@code mindgarden.homepage-inquiry.*} 바인딩. 로그인용 {@code mindgarden.security.captcha} 와 분리한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@ConfigurationProperties(prefix = "mindgarden.homepage-inquiry")
@Getter
@Setter
public class HomepageInquiryProperties {

    /**
     * CONTACTED 이후 보관 일수(기본 365). 퍼지는 {@link #purgeEnabled} 가 true 일 때만.
     */
    private int purgeAfterContactedDays = 365;

    /** 보관기간 초과 행 삭제 스케줄 활성화 여부(기본 비활성). */
    private boolean purgeEnabled = false;

    /**
     * 알림 채널 콤마 목록. 기본 {@code badge,push}.
     * email·sms 는 명시 포함 시에도 현재 no-op(개인정보 미포함).
     */
    private String notificationChannels = "badge,push";

    /** 홈페이지 문의 전용 Turnstile. */
    private Captcha captcha = new Captcha();

    /** 공개 홈페이지 CORS exact origin 목록(공용). */
    private Cors cors = new Cors();

    /**
     * @return 정규화된 채널 목록(소문자, 공백 제거)
     */
    public List<String> resolvedNotificationChannels() {
        if (!StringUtils.hasText(notificationChannels)) {
            return List.of("badge", "push");
        }
        return Arrays.stream(notificationChannels.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * 홈페이지 문의 전용 CAPTCHA.
     */
    @Getter
    @Setter
    public static class Captcha {

        /** 기본 활성. 시크릿 없으면 POST fail-closed(503). */
        private boolean enabled = true;

        /** Turnstile secret — {@code MINDGARDEN_HOMEPAGE_CAPTCHA_SECRET_KEY}. */
        private String secretKey = "";
    }

    /**
     * 공개 홈페이지 CORS.
     */
    @Getter
    @Setter
    public static class Cors {

        /**
         * exact Origin 기본 3종. staging 추가분은
         * {@code HOMEPAGE_PUBLIC_CORS_ALLOWED_ORIGINS} 로도 병합 가능.
         */
        private List<String> allowedOrigins = new ArrayList<>(List.of(
                "https://m-garden.co.kr",
                "https://www.m-garden.co.kr",
                "https://staging.m-garden.co.kr"));
    }
}
