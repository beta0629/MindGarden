package com.coresolution.consultation.service.support;

import java.time.Clock;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import com.coresolution.consultation.config.ClientEventBackfillProperties;
import com.coresolution.consultation.constant.ClientEventBackfillConstants;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 서버 로컬 CLI 백필 운영시간 창 가드.
 *
 * <p>기본 KST 11≤h&lt;20 이면 모든 모드(dry-run 포함) 거부. {@link Clock} 주입으로 테스트 고정.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Component
public class ClientEventBackfillBusinessHoursGuard {

    private final ClientEventBackfillProperties properties;
    private Clock clock;

    /**
     * @param properties 백필 CLI 프로퍼티
     */
    public ClientEventBackfillBusinessHoursGuard(ClientEventBackfillProperties properties) {
        this.properties = properties;
        this.clock = Clock.systemUTC();
    }

    /**
     * 테스트용 Clock 교체.
     *
     * @param clock 고정 Clock
     */
    void useClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    /**
     * 차단 시간대이면 예외.
     *
     * @throws IllegalStateException 운영시간 창 내
     */
    public void requireOutsideBlockedWindow() {
        ZoneId zone = resolveZone();
        ZonedDateTime now = ZonedDateTime.now(clock).withZoneSameInstant(zone);
        int hour = now.getHour();
        int start = properties.getBlockedHourStart();
        int end = properties.getBlockedHourEnd();
        if (hour >= start && hour < end) {
            throw new IllegalStateException(
                    "client_event backfill CLI blocked during business hours: zone="
                            + zone
                            + ", hour="
                            + hour
                            + ", blocked=["
                            + start
                            + ","
                            + end
                            + ")");
        }
    }

    private ZoneId resolveZone() {
        String zone = properties.getZone();
        if (!StringUtils.hasText(zone)) {
            return ZoneId.of(ClientEventBackfillConstants.DEFAULT_ZONE);
        }
        return ZoneId.of(zone.trim());
    }
}
