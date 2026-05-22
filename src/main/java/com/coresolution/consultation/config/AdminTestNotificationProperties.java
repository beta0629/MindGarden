package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import lombok.Getter;
import lombok.Setter;

/**
 * 어드민 SMS·알림톡 테스트 발송 도구 설정.
 *
 * <p>{@code admin.test-notification.*} 키로 바인딩. 기획서 §4.X C5({@code 10_100}) 기본값.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@ConfigurationProperties(prefix = "admin.test-notification")
@Getter
@Setter
public class AdminTestNotificationProperties {

    /** 사용자·테넌트당 rate-limit 한도. */
    private RateLimit rateLimit = new RateLimit();

    /** 이력 페이지 기본 크기. */
    private int historyPageSizeDefault = 30;

    /** 이력 페이지 최대 크기(클라이언트 요청 상한). */
    private int historyPageSizeMax = 100;

    /**
     * Rate-limit 한도(사용자·테넌트당 분당/일당).
     */
    @Getter
    @Setter
    public static class RateLimit {
        /** 분당 발송 한도. */
        private int perMinute = 10;
        /** 일당 발송 한도. */
        private int perDay = 100;
    }
}
