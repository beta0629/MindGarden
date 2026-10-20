package com.coresolution.consultation.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 서버 기준 시각 응답. 클라이언트 clock offset 동기화용.
 * 테넌트·PII 없음.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Getter
@Builder
public class SystemTimeResponse {

    /** Unix epoch milliseconds (서버 Clock 기준). */
    private final long epochMillis;

    /** 표시·판정용 IANA zone (TimeZoneConfig 와 동일 Asia/Seoul). */
    private final String zone;

    /**
     * @param epochMillis 서버 epoch ms
     * @param zone IANA zone id
     * @return 응답
     */
    public static SystemTimeResponse of(long epochMillis, String zone) {
        return SystemTimeResponse.builder()
                .epochMillis(epochMillis)
                .zone(zone)
                .build();
    }
}
