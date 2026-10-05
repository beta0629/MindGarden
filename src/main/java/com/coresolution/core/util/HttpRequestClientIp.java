package com.coresolution.core.util;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.concurrent.atomic.AtomicReference;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * 클라이언트 IP는 한 곳에서만 정한다.
 * 바로 앞 피어가 {@link ClientIpTrust} 에 있을 때만 그 피어에 묶인 헤더를 읽고,
 * 그 외에는 연결 주소만 쓴다. 클라이언트가 보낸 전달 헤더는 피어가 신뢰 대역이 아니면 보지 않는다.
 *
 * <p>앱 기동 시 {@link com.coresolution.core.config.ClientIpConfiguration} 이 설정값을
 * {@link #configure(ClientIpTrust)} 로 넣는다. 설정 전에는 전달 헤더를 믿지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
public final class HttpRequestClientIp {

    private static final AtomicReference<ClientIpTrust> TRUST = new AtomicReference<>(ClientIpTrust.none());

    private static final String UNKNOWN = "unknown";

    private HttpRequestClientIp() {
    }

    /**
     * 프로세스 기본 정책을 바꾼다. 앱 기동 시 한 번 호출한다.
     *
     * @param trust 신뢰 프록시 정책. {@code null} 이면 전달 헤더를 믿지 않는다.
     */
    public static void configure(ClientIpTrust trust) {
        TRUST.set(trust == null ? ClientIpTrust.none() : trust);
    }

    /**
     * 지금 프로세스에 들어 있는 정책. 테스트가 정책을 잠시 바꿨다가 되돌릴 때 쓴다.
     *
     * @return 현재 정책. {@code null} 이 되지 않는다.
     */
    public static ClientIpTrust current() {
        return TRUST.get();
    }

    /**
     * 현재 프로세스 정책으로 클라이언트 IP를 반환한다.
     *
     * @param request HTTP 요청
     * @return 클라이언트 IP. 요청이 없으면 {@code null}
     */
    public static String resolve(HttpServletRequest request) {
        return resolve(request, TRUST.get());
    }

    /**
     * 지정한 정책으로 클라이언트 IP를 반환한다.
     *
     * @param request HTTP 요청
     * @param trust 신뢰 프록시 정책. {@code null} 이면 전달 헤더를 믿지 않는다.
     * @return 클라이언트 IP. 요청이 없으면 {@code null}
     */
    public static String resolve(HttpServletRequest request, ClientIpTrust trust) {
        if (request == null) {
            return null;
        }
        String remoteAddr = request.getRemoteAddr();
        ClientIpTrust policy = trust == null ? ClientIpTrust.none() : trust;
        String headerName = policy.headerForPeer(remoteAddr);
        if (StringUtils.hasText(headerName)) {
            String fromProxy = firstLiteralIp(request.getHeader(headerName));
            if (fromProxy != null) {
                return fromProxy;
            }
        }
        return remoteAddr;
    }

    /**
     * 헤더 값의 첫 토큰이 IP 리터럴이면 그 문자열을 반환한다. 호스트 이름은 거절한다.
     *
     * @param headerValue 헤더 원문
     * @return IP 또는 {@code null}
     */
    static String firstLiteralIp(String headerValue) {
        if (!StringUtils.hasText(headerValue)) {
            return null;
        }
        String token = headerValue.split(",")[0].trim();
        if (!StringUtils.hasText(token) || UNKNOWN.equalsIgnoreCase(token)) {
            return null;
        }
        if (token.startsWith("[") && token.contains("]")) {
            token = token.substring(1, token.indexOf(']'));
        }
        if (isIpv4Literal(token) || isIpv6Literal(token)) {
            return token;
        }
        return null;
    }

    private static boolean isIpv4Literal(String value) {
        String[] parts = value.split("\\.", -1);
        if (parts.length != 4) {
            return false;
        }
        for (String part : parts) {
            if (part.isEmpty() || part.length() > 3) {
                return false;
            }
            for (int i = 0; i < part.length(); i++) {
                char c = part.charAt(i);
                if (c < '0' || c > '9') {
                    return false;
                }
            }
            int octet = Integer.parseInt(part);
            if (octet > 255) {
                return false;
            }
        }
        return true;
    }

    private static boolean isIpv6Literal(String value) {
        if (value.indexOf(':') < 0) {
            return false;
        }
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            boolean hex = (c >= '0' && c <= '9')
                || (c >= 'a' && c <= 'f')
                || (c >= 'A' && c <= 'F');
            if (!hex && c != ':' && c != '.') {
                return false;
            }
        }
        try {
            InetAddress address = InetAddress.getByName(value);
            return address instanceof Inet6Address;
        } catch (UnknownHostException ex) {
            return false;
        }
    }
}
