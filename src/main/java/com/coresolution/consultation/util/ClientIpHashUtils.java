package com.coresolution.consultation.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * 클라이언트 IP 단방향 해시 유틸. 원문 IP 를 저장·로그하지 않을 때 사용한다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public final class ClientIpHashUtils {

    private static final String ALGORITHM = "SHA-256";

    private ClientIpHashUtils() {
    }

    /**
     * SHA-256 소문자 hex. null/blank 이면 null.
     *
     * @param clientIp 원문 IP
     * @return 해시 또는 null
     */
    public static String sha256Hex(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            return HexFormat.of().formatHex(digest.digest(clientIp.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
