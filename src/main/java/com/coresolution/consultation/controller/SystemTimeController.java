package com.coresolution.consultation.controller;

import java.time.Clock;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coresolution.consultation.constant.SystemTimeConstants;
import com.coresolution.consultation.dto.SystemTimeResponse;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;

import lombok.extern.slf4j.Slf4j;

/**
 * 서버 기준 시각 공개 API. 인증·테넌트 불필요.
 * session-info / health timestamp 와 계약을 분리한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Slf4j
@RestController
@RequestMapping(SystemTimeConstants.API_PATH)
public class SystemTimeController extends BaseApiController {

    private final Clock clock;

    /** 기본: Asia/Seoul system clock ({@link com.coresolution.core.config.TimeZoneConfig} 정합). */
    public SystemTimeController() {
        this(Clock.system(SystemTimeConstants.ZONE));
    }

    /**
     * 테스트용 Clock 주입.
     *
     * @param clock 서버 Clock
     */
    SystemTimeController(Clock clock) {
        this.clock = clock != null ? clock : Clock.system(SystemTimeConstants.ZONE);
    }

    /**
     * 서버 현재 시각. {@code Cache-Control: no-store}.
     *
     * @return {@code { epochMillis, zone }} 를 ApiResponse 로 래핑
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SystemTimeResponse>> getServerTime() {
        long epochMillis = clock.millis();
        SystemTimeResponse body = SystemTimeResponse.of(epochMillis, SystemTimeConstants.ZONE_ID);
        log.debug("서버 시각 조회: epochMillis={}, zone={}", epochMillis, SystemTimeConstants.ZONE_ID);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(ApiResponse.success(body));
    }
}
