package com.coresolution.consultation.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 홈페이지 공개 문의·공개 홈 CORS 설정.
 *
 * <p>{@code mindgarden.homepage-inquiry.*} 바인딩.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@ConfigurationProperties(prefix = "mindgarden.homepage-inquiry")
@Getter
@Setter
public class HomepageInquiryProperties {

    /**
     * 보관 일수. {@code null} 이면 무기한 보관.
     * 퍼지 훅은 {@link #purgeEnabled} 가 true 일 때만 동작(기본 false).
     */
    private Integer retentionDays;

    /** 보관기간 초과 행 삭제 스케줄 활성화 여부(기본 비활성). */
    private boolean purgeEnabled = false;

    /**
     * 알림 채널: {@code badge}(기본) / {@code email} / {@code sms}.
     * email·sms 는 명시 활성화 전까지 no-op.
     */
    private String notificationChannel = "badge";

    /** 공개 홈페이지 CORS exact origin 목록(공용). */
    private Cors cors = new Cors();

    /**
     * 공개 홈페이지 CORS.
     */
    @Getter
    @Setter
    public static class Cors {

        /**
         * exact Origin 목록. 기본: m-garden.co.kr / www.
         * staging 등은 환경변수 {@code HOMEPAGE_PUBLIC_CORS_ALLOWED_ORIGINS} 로 추가.
         */
        private List<String> allowedOrigins = new ArrayList<>(List.of(
                "https://m-garden.co.kr",
                "https://www.m-garden.co.kr"));
    }
}
