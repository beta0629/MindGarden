package com.coresolution.consultation.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * {@code users.profile_image_url} 등에 base64 dataURI 가 저장돼 응답 본문이 폭증하는 회귀를 차단하는 가드.
 *
 * <p>배경 — 2026-06-08 P0 진단: 사용자 한 명의 {@code profile_image_url} 컬럼(longtext) 에 300KB 가량의
 * {@code data:image/...;base64,...} 가 저장돼 마이페이지 응답이 225KB 까지 폭증했다. 본 가드는 동일 회귀가
 * 다른 사용자에게서도 발생하지 않도록 진입점과 응답 직렬화 직전 두 지점에서 모두 검증한다.</p>
 *
 * <p>운영 정책:
 * <ul>
 *   <li>입력 가드: {@link #validateInbound(String)} — base64 dataURI 거부, 길이 초과 거부 → {@link IllegalArgumentException}</li>
 *   <li>출력 가드(방어선): {@link #sanitizeOutbound(String)} — 손상된 row 가 이미 DB 에 있을 때 응답을 안전하게 자름</li>
 * </ul>
 * 추후 S3 업로드 분리 작업은 별도 PR. 본 가드는 거부만 담당한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
public final class ProfileImageUrlGuard {

    private static final Logger log = LoggerFactory.getLogger(ProfileImageUrlGuard.class);

    /** 입력 가드 거부 메시지 — base64 dataURI 가 들어왔을 때. */
    public static final String MSG_BASE64_REJECTED =
        "프로필 이미지는 파일 업로드 API 를 사용해 주세요. (URL 만 허용)";

    /** 입력 가드 거부 메시지 — URL 길이가 한도를 넘었을 때. */
    public static final String MSG_TOO_LONG =
        "프로필 이미지 URL 이 너무 깁니다.";

    /**
     * 허용 URL 최대 길이 (bytes 가 아니라 char 수).
     * V20260609_002 Flyway 마이그레이션으로 {@code users.profile_image_url} 컬럼을 longtext → varchar(500) 으로
     * 축소했기 때문에, 입력 가드도 동일 한도(500) 로 정렬해 DB 인서트 실패 전에 400 으로 거부한다.
     */
    public static final int MAX_URL_LENGTH = 500;

    /** 응답 가드 임계치 — 이 길이를 초과하면 응답에서는 null 로 치환해 폭증을 막는다. */
    public static final int OUTBOUND_WARN_THRESHOLD = 50_000;

    /** base64 dataURI 접두어 (소문자 비교). */
    private static final String BASE64_PREFIX_LOWER = "data:";

    private ProfileImageUrlGuard() {
    }

    /**
     * 클라이언트가 보낸 profile image 입력을 검증한다. 위반 시 {@link IllegalArgumentException} 을 던져
     * 호출부가 400 Bad Request 로 응답하게 한다 (GlobalExceptionHandler 가 동일 매핑).
     *
     * @param value 사용자가 보낸 profile image 문자열
     * @throws IllegalArgumentException base64 dataURI 이거나 길이 초과
     */
    public static void validateInbound(String value) {
        if (value == null) {
            return;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return;
        }
        if (isBase64DataUri(trimmed)) {
            log.warn("profile image base64 dataURI 거부: length={}", trimmed.length());
            throw new IllegalArgumentException(MSG_BASE64_REJECTED);
        }
        if (trimmed.length() > MAX_URL_LENGTH) {
            log.warn("profile image URL 길이 초과 거부: length={}, max={}", trimmed.length(), MAX_URL_LENGTH);
            throw new IllegalArgumentException(MSG_TOO_LONG);
        }
    }

    /**
     * 응답으로 내보낼 profile image URL 을 마지막으로 한 번 더 점검해, 비정상적으로 큰 값(이미 DB 에 저장된
     * 손상 row)을 null 로 치환한다. WARN 로그로 진단 단서를 남겨 추후 청소 작업이 가능하게 한다.
     *
     * @param value DB 에 저장된 값
     * @return 안전한 응답 값(임계치 초과 또는 base64 면 null, 그 외 그대로)
     */
    public static String sanitizeOutbound(String value) {
        if (value == null) {
            return null;
        }
        if (isBase64DataUri(value)) {
            log.warn("profile image 응답 가드: DB 에 base64 dataURI 가 저장돼 있어 null 로 치환 (length={})",
                value.length());
            return null;
        }
        if (value.length() > OUTBOUND_WARN_THRESHOLD) {
            log.warn("profile image 응답 가드: 길이 초과로 null 로 치환 (length={}, threshold={})",
                value.length(), OUTBOUND_WARN_THRESHOLD);
            return null;
        }
        return value;
    }

    private static boolean isBase64DataUri(String value) {
        if (value == null || value.length() < BASE64_PREFIX_LOWER.length()) {
            return false;
        }
        String head = value.substring(0, BASE64_PREFIX_LOWER.length());
        return BASE64_PREFIX_LOWER.equalsIgnoreCase(head);
    }
}
