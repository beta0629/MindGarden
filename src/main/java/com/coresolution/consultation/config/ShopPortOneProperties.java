package com.coresolution.consultation.config;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 쇼핑 PortOne 검증·재시도 설정 ({@code shop.portone.*}).
 *
 * @author MindGarden
 * @since 2026-10-16
 */
@Data
@ConfigurationProperties(prefix = "shop.portone")
public class ShopPortOneProperties {

    /**
     * PortOne 검증 UNKNOWN/IN_PROGRESS 최대 시도 횟수. 도달 시 관리자 알림(자동 취소 없음).
     */
    private int verifyUnknownMaxAttempts = ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_MAX_ATTEMPTS;

    /**
     * PortOne 검증 UNKNOWN/IN_PROGRESS 최초 관측 후 최대 경과(ms). {@code 0} 이하면 연령 한도 비활성.
     */
    private long verifyUnknownMaxAgeMs = ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_MAX_AGE_MS;

    /**
     * 재시도 소진 후 PortOne 장주기 폴링 간격(ms).
     */
    private long verifyUnknownExhaustedPollIntervalMs =
            ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_EXHAUSTED_POLL_INTERVAL_MS;

    /**
     * 검증 추적 컬럼 저장 시 낙관적 락 충돌 최대 재시도 횟수.
     */
    private int verifyUnknownLockMaxRetries =
            ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_LOCK_MAX_RETRIES;

    /**
     * 낙관적 락 재시도 사이 대기(ms). {@code 0} 이면 대기 없음.
     */
    private long verifyUnknownLockRetryDelayMs =
            ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_LOCK_RETRY_DELAY_MS;

    /**
     * @return 1 이상인 최대 UNKNOWN/IN_PROGRESS 시도 횟수
     */
    public int resolvedVerifyUnknownMaxAttempts() {
        return Math.max(1, verifyUnknownMaxAttempts);
    }

    /**
     * @return 연령 한도(ms). {@code 0} 이하면 비활성
     */
    public long resolvedVerifyUnknownMaxAgeMs() {
        return Math.max(0L, verifyUnknownMaxAgeMs);
    }

    /**
     * @return 소진 후 폴링 간격(ms). 최소 1ms
     */
    public long resolvedVerifyUnknownExhaustedPollIntervalMs() {
        return Math.max(1L, verifyUnknownExhaustedPollIntervalMs);
    }

    /**
     * @return 낙관적 락 최대 재시도 횟수. 최소 1
     */
    public int resolvedVerifyUnknownLockMaxRetries() {
        return Math.max(1, verifyUnknownLockMaxRetries);
    }

    /**
     * @return 낙관적 락 재시도 대기(ms). {@code 0} 이상
     */
    public long resolvedVerifyUnknownLockRetryDelayMs() {
        return Math.max(0L, verifyUnknownLockRetryDelayMs);
    }
}
