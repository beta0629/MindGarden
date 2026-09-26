package com.coresolution.consultation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * FE 세션 보안 스위치 스냅샷 ({@code GET /api/v1/auth/session-security-flags}).
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionSecurityFlagsResponse {

    /** OAuth 후 current-user foreground 검증 필수. */
    private boolean oauthRequireServerVerify;

    /** background 401 시 FE user 유지. */
    private boolean background401KeepUser;

    /** shell chrome soft-fail 활성. */
    private boolean softFailEnabled;

    /** 캐시 TTL(ms) — FE 재조회 간격 힌트. */
    private long cacheTtlMs;
}
