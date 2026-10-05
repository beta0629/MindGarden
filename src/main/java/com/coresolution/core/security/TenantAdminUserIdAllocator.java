package com.coresolution.core.security;

import java.util.Locale;
import java.util.UUID;

/**
 * 온보딩 테넌트 관리자 {@code users.user_id}.
 *
 * <p>이메일 로컬 파트를 쓰지 않는다. 로컬 파트는 다른 테넌트의 soft-delete 행이
 * 전역 UNIQUE 를 잡고 있으면 INSERT 가 거절된다. 베이스는 테넌트 토큰과 무작위
 * 접미사이고, 같은 테넌트 안에서의 충돌 접미사는 호출부가 붙인다.</p>
 *
 * <p>{@code users.user_id} 는 VARCHAR(50). 프로시저가 숫자 접미사를 붙일 자리를 남긴다.</p>
 */
public final class TenantAdminUserIdAllocator {

    public static final String PREFIX = "adm-";

    /** 프로시저 {@code @counter} 최대 1000(4자)을 남긴 베이스 상한. */
    public static final int MAX_BASE_LENGTH = 46;

    static final int TENANT_TOKEN_LENGTH = 12;

    static final int RANDOM_HEX_LENGTH = 10;

    private TenantAdminUserIdAllocator() {
    }

    /**
     * 테넌트에 묶인 관리자 user_id 베이스. 이메일과 무관하다.
     *
     * @param tenantId 테넌트 ID
     * @return {@code adm-} 로 시작하는 46자 이하 베이스
     */
    public static String allocate(String tenantId) {
        return allocate(tenantId, UUID.randomUUID());
    }

    /**
     * 테스트가 무작위 값을 고정할 때 사용한다.
     *
     * @param tenantId 테넌트 ID
     * @param random   접미사 원천
     * @return user_id 베이스
     */
    public static String allocate(String tenantId, UUID random) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("테넌트 ID는 필수입니다.");
        }
        if (random == null) {
            throw new IllegalArgumentException("user_id 난수는 필수입니다.");
        }
        String token = tenantId.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        if (token.isEmpty()) {
            token = "tenant";
        }
        if (token.length() > TENANT_TOKEN_LENGTH) {
            token = token.substring(0, TENANT_TOKEN_LENGTH);
        }
        String hex = random.toString().replace("-", "");
        String body = PREFIX + token + "-" + hex.substring(0, RANDOM_HEX_LENGTH);
        if (body.length() > MAX_BASE_LENGTH) {
            return body.substring(0, MAX_BASE_LENGTH);
        }
        return body;
    }

    /**
     * 같은 테넌트에 이미 있는 user_id(삭제 행 포함) 뒤에 붙이는 접미사.
     *
     * @param base   {@link #allocate(String)} 결과
     * @param suffix 1 이상
     * @return 50자 이하
     */
    public static String withSuffix(String base, int suffix) {
        if (base == null || base.isBlank()) {
            throw new IllegalArgumentException("user_id 베이스는 필수입니다.");
        }
        if (suffix < 1) {
            throw new IllegalArgumentException("user_id 접미사는 1 이상이어야 합니다.");
        }
        String extra = Integer.toString(suffix);
        String combined = base + extra;
        if (combined.length() <= 50) {
            return combined;
        }
        int keep = 50 - extra.length();
        if (keep < PREFIX.length()) {
            throw new IllegalArgumentException("user_id 접미사를 붙일 자리가 없습니다.");
        }
        return base.substring(0, keep) + extra;
    }
}
