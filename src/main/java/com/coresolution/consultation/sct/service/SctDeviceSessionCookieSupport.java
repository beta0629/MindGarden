package com.coresolution.consultation.sct.service;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriUtils;

/**
 * SCT 단말 바인딩 쿠키 — 본인확인(OTP) 성공 후 발급하는 verify 세션 ID 를 HttpOnly 쿠키로 심는다.
 *
 * <p>링크(토큰)만으로는 세션이 생기지 않고, 이 쿠키를 가진 브라우저만 재인증 없이 이어쓴다.
 * 쿠키 Path 는 {@code /api/v1/public/sct/{token}} 로 좁혀 다른 초대·링크로 전송되지 않는다.
 * HttpOnly·SameSite·Secure 정책은 {@link SessionCookieSupport} SSOT 를 따른다(Domain 없음=호스트 전용).</p>
 *
 * @author MindGarden
 * @since 2026-11-28
 */
@Component
public class SctDeviceSessionCookieSupport {

    private static final String FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";
    private static final String HTTPS = "https";

    private final SessionCookieSupport sessionCookieSupport;

    /**
     * @param sessionCookieSupport HttpOnly/SameSite/Secure SSOT
     */
    public SctDeviceSessionCookieSupport(SessionCookieSupport sessionCookieSupport) {
        this.sessionCookieSupport = sessionCookieSupport;
    }

    /**
     * 단말 세션 쿠키.
     *
     * @param token         URL 의 opaque 토큰(쿠키 Path 에만 사용)
     * @param sessionId     verify 세션 ID
     * @param maxAgeSeconds 절대 만료까지 남은 초
     * @param request       Secure 판단
     * @return Set-Cookie 용 ResponseCookie
     */
    public ResponseCookie build(String token, String sessionId, int maxAgeSeconds,
            HttpServletRequest request) {
        return ResponseCookie.from(SctConsentKeys.DEVICE_SESSION_COOKIE, sessionId)
                .path(cookiePath(token))
                .httpOnly(true)
                .secure(isSecure(request))
                .sameSite(sessionCookieSupport.resolveSameSite())
                .maxAge(maxAgeSeconds)
                .build();
    }

    /**
     * 요청 쿠키에서 단말 세션 ID 읽기.
     *
     * @param request 요청
     * @return 세션 ID(없으면 empty)
     */
    public Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request == null ? null : request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (SctConsentKeys.DEVICE_SESSION_COOKIE.equals(cookie.getName())
                    && StringUtils.hasText(cookie.getValue())) {
                return Optional.of(cookie.getValue().trim());
            }
        }
        return Optional.empty();
    }

    static String cookiePath(String token) {
        String segment = UriUtils.encodePathSegment(token == null ? "" : token.trim(),
                StandardCharsets.UTF_8);
        return SctConstants.PUBLIC_API_PREFIX + "/" + segment;
    }

    private boolean isSecure(HttpServletRequest request) {
        if (sessionCookieSupport.resolveSecure(request)) {
            return true;
        }
        // 리버스 프록시(TLS 종단) 뒤에서는 request.isSecure() 가 false 일 수 있다. Secure 플래그만 올리므로 위조 무해.
        return request != null && HTTPS.equalsIgnoreCase(request.getHeader(FORWARDED_PROTO_HEADER));
    }
}
