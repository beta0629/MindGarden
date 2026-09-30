package com.coresolution.consultation.dto.auth;

import lombok.Builder;
import lombok.Value;

/**
 * 현재 요청의 세션 식별 정보 — 현재 세션만 종료할 때 사용.
 *
 * <p>모든 필드는 선택이다. 있는 것만 폐기하고, 없다고 해서 계정 전체 폐기로 대체하지 않는다.
 * 토큰 원문은 로그에 남기지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@Value
@Builder
public class CurrentSessionCredentials {

    /** {@code user_sessions.session_id} (웹 HttpSession 기반 로그인). */
    String sessionId;

    /** 요청 Authorization 헤더의 Access JWT. */
    String accessToken;

    /** 요청 본문으로 전달된 Refresh JWT (선택 — sid 없는 구 토큰 폐기용). */
    String refreshToken;
}
