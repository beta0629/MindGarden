package com.coresolution.consultation.sct.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * SCT 단말 바인딩 쿠키 — 본인확인(OTP) 성공 후 발급하는 verify 세션 ID 를 HttpOnly 쿠키로 심는다.
 *
 * <p>링크(토큰)만으로는 세션이 생기지 않고, 이 쿠키를 가진 브라우저만 재인증 없이 이어쓴다.
 * 단축 링크를 열 때마다 교환 코드가 새로 발급되므로 쿠키 Path 는 교환 코드가 아니라 공통
 * {@code /api/v1/public/sct} 이다. 한 단말에 여러 초대가 공존하도록 쿠키 이름은
 * {@code SCT_DEVICE_SESSION_<초대·테넌트 해시 16자>} 이고, 값(verify 세션 ID)은 서버가 초대 ID·테넌트와
 * 대조한다(다른 초대·테넌트의 세션은 거부). 서버는 세션 ID 의 SHA-256 만 저장한다.
 * HttpOnly·SameSite·Secure 정책은 {@link SessionCookieSupport} SSOT 를 따른다(Domain 없음=호스트 전용).</p>
 *
 * @author MindGarden
 * @since 2026-11-28
 */
@Component
public class SctDeviceSessionCookieSupport {

    private static final String FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";
    private static final String HTTPS = "https";
    private static final int REF_HEX_LENGTH = 16;

    private final SessionCookieSupport sessionCookieSupport;

    /**
     * @param sessionCookieSupport HttpOnly/SameSite/Secure SSOT
     */
    public SctDeviceSessionCookieSupport(SessionCookieSupport sessionCookieSupport) {
        this.sessionCookieSupport = sessionCookieSupport;
    }

    /**
     * 초대·테넌트별 쿠키 이름 접미(비밀 아님 — 값이 아니라 이름 분리용).
     *
     * @param tenantId     테넌트
     * @param invitationId 초대 ID
     * @return 16자 hex
     */
    public static String refFor(String tenantId, Long invitationId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("sct-device:" + tenantId + ":" + invitationId)
                    .getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, REF_HEX_LENGTH);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /**
     * @param ref {@link #refFor}
     * @return 쿠키 이름
     */
    public static String cookieName(String ref) {
        return SctConsentKeys.DEVICE_SESSION_COOKIE + "_" + ref;
    }

    /**
     * 단말 세션 쿠키.
     *
     * @param ref           초대·테넌트 해시 접미
     * @param sessionId     verify 세션 ID
     * @param maxAgeSeconds 절대 만료까지 남은 초
     * @param request       Secure 판단
     * @return Set-Cookie 용 ResponseCookie
     */
    public ResponseCookie build(String ref, String sessionId, int maxAgeSeconds,
            HttpServletRequest request) {
        return ResponseCookie.from(cookieName(ref), sessionId)
                .path(SctConstants.PUBLIC_API_PREFIX)
                .httpOnly(true)
                .secure(isSecure(request))
                .sameSite(sessionCookieSupport.resolveSameSite())
                .maxAge(maxAgeSeconds)
                .build();
    }

    /**
     * 요청 쿠키에서 해당 초대의 단말 세션 ID 읽기.
     *
     * @param request 요청
     * @param ref     초대·테넌트 해시 접미
     * @return 세션 ID(없으면 empty)
     */
    public Optional<String> read(HttpServletRequest request, String ref) {
        Cookie[] cookies = request == null ? null : request.getCookies();
        if (cookies == null || !StringUtils.hasText(ref)) {
            return Optional.empty();
        }
        String name = cookieName(ref);
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return Optional.of(cookie.getValue().trim());
            }
        }
        return Optional.empty();
    }

    private boolean isSecure(HttpServletRequest request) {
        if (sessionCookieSupport.resolveSecure(request)) {
            return true;
        }
        // 리버스 프록시(TLS 종단) 뒤에서는 request.isSecure() 가 false 일 수 있다. Secure 플래그만 올리므로 위조 무해.
        return request != null && HTTPS.equalsIgnoreCase(request.getHeader(FORWARDED_PROTO_HEADER));
    }
}
