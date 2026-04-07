package com.coresolution.consultation.constant;

import org.springframework.util.StringUtils;

/**
 * 관리자 내담자 등록 시 합성 이메일·검증 메시지 상수.
 *
 * @author CoreSolution
 * @since 2026-04-07
 */
public final class ClientRegistrationConstants {

    /** 합성 이메일 도메인 접미사 (로컬파트@&lt;테넌트&gt;.&lt;접미사&gt;). */
    public static final String SYNTHETIC_EMAIL_DOMAIN_SUFFIX = "clients.noreply";

    /** 전화만 등록 시 합성 이메일 로컬 파트 접두사. */
    public static final String SYNTHETIC_EMAIL_LOCAL_PREFIX = "phone-";

    public static final String MSG_EMAIL_OR_PHONE_REQUIRED = "이메일 또는 휴대폰 번호 중 하나는 입력해야 합니다.";

    public static final String MSG_INVALID_PHONE = "올바른 휴대폰 번호가 아닙니다.";

    public static final String MSG_DUPLICATE_PHONE = "동일 테넌트에 이미 등록된 휴대폰 번호입니다.";

    public static final String MSG_DUPLICATE_EMAIL = "동일 테넌트에 이미 등록된 이메일입니다.";

    public static final String MSG_INVALID_EMAIL_FORMAT = "올바른 이메일 형식이 아닙니다.";

    public static final String DEFAULT_CLIENT_DISPLAY_NAME = "내담자";

    private ClientRegistrationConstants() {
    }

    /**
     * RFC 이메일 도메인 라벨에 맞게 테넌트 ID를 정제합니다. {@code @}, 공백 제거 후 허용 문자만 유지합니다.
     *
     * @param tenantId 테넌트 ID
     * @return 비어 있으면 {@code t}
     */
    public static String sanitizeTenantIdForSyntheticEmailDomain(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return "t";
        }
        String s = tenantId.replace("@", "").replaceAll("\\s+", "");
        s = s.replaceAll("[^a-zA-Z0-9.-]", "-");
        s = s.replaceAll("-{2,}", "-");
        if (s.isEmpty() || s.equals("-")) {
            return "t";
        }
        if (s.startsWith(".")) {
            s = "t" + s;
        }
        if (s.endsWith(".")) {
            s = s.substring(0, s.length() - 1);
        }
        return s;
    }

    /**
     * 전화만 등록 시 사용할 합성 이메일 주소를 만듭니다. 충돌 시 {@code collisionIndex}로 로컬 파트에 접미사를 붙입니다.
     *
     * @param normalizedDigits {@link com.coresolution.consultation.util.LoginIdentifierUtils} 정규화 결과
     * @param sanitizedTenant  {@link #sanitizeTenantIdForSyntheticEmailDomain(String)} 결과
     * @param collisionIndex   0이면 접미사 없음, 1 이상이면 로컬에 {@code u} + index
     * @return 합성 이메일 평문
     */
    public static String buildSyntheticEmail(String normalizedDigits, String sanitizedTenant, int collisionIndex) {
        String local = SYNTHETIC_EMAIL_LOCAL_PREFIX + normalizedDigits
                + (collisionIndex > 0 ? "u" + collisionIndex : "");
        String domain = sanitizedTenant + "." + SYNTHETIC_EMAIL_DOMAIN_SUFFIX;
        return local + "@" + domain;
    }
}
