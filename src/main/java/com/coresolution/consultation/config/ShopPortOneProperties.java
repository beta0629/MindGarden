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
     * PortOne 검증 UNKNOWN 최대 시도 횟수. 도달 시 자동 재시도 중단·관리자 알림(자동 취소 없음).
     */
    private int verifyUnknownMaxAttempts = ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_MAX_ATTEMPTS;

    /**
     * PortOne 검증 UNKNOWN 최초 관측 후 최대 경과(ms). {@code 0} 이하면 연령 한도 비활성.
     */
    private long verifyUnknownMaxAgeMs = ShopCheckoutConstants.DEFAULT_VERIFY_UNKNOWN_MAX_AGE_MS;

    /**
     * @return 1 이상인 최대 UNKNOWN 시도 횟수
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
}
