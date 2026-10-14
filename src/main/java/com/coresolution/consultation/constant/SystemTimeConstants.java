package com.coresolution.consultation.constant;

import java.time.ZoneId;

/**
 * 서버 시각 SSOT 상수. {@code TimeZoneConfig} 기본 zone 과 정합.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
public final class SystemTimeConstants {

    /** 운영 표시·판정 zone (IANA). */
    public static final String ZONE_ID = "Asia/Seoul";

    /** {@link #ZONE_ID} 의 ZoneId. */
    public static final ZoneId ZONE = ZoneId.of(ZONE_ID);

    /** 공개 시각 API 경로. SecurityConfig·PublicApiPathPolicy·Jwt shouldNotFilter 와 동기화. */
    public static final String API_PATH = "/api/v1/time";

    private SystemTimeConstants() {
    }
}
