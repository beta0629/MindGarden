package com.coresolution.consultation.dto.lifecycle;

/**
 * 자발 탈퇴 신청 시 본인이 선택한 옵션을 보관하는 immutable VO.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b — 본인 옵션
 * "커뮤니티 본문도 삭제" 를 30일 유예 시점에 {@code users.withdrawal_options_json}
 * 컬럼에 직렬화하여 보관하고, {@code WithdrawalGracePeriodScheduler} 가
 * ANONYMIZED 전이 시점에 {@code UserAnonymizationService} 로 옵션을 전달한다.</p>
 *
 * <p>JSON 직렬화 책임은 본 클래스가 직접 담당한다 (Jackson/Gson 의존을 controller/service
 * 시그니처에 노출하지 않기 위해 단순 string 직렬화로 유지). 컬럼이 NULL/공백/parse 실패인
 * 경우는 모두 {@link #defaults()} 로 동작한다 — 기본값 보존.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
public final class WithdrawalOptions {

    private static final WithdrawalOptions DEFAULTS = new WithdrawalOptions(false);

    private final boolean deleteCommunityBody;

    private WithdrawalOptions(boolean deleteCommunityBody) {
        this.deleteCommunityBody = deleteCommunityBody;
    }

    /**
     * 명시적 옵션 인스턴스 생성.
     *
     * @param deleteCommunityBody Q12-b — true 면 본문도 삭제, false 면 KEEP
     * @return immutable VO
     */
    public static WithdrawalOptions of(boolean deleteCommunityBody) {
        return deleteCommunityBody ? new WithdrawalOptions(true) : DEFAULTS;
    }

    /**
     * 기본값 — 모든 옵션 미선택 (Q12-b 기본 — 본문 KEEP).
     *
     * @return 기본 옵션 인스턴스
     */
    public static WithdrawalOptions defaults() {
        return DEFAULTS;
    }

    /**
     * users.withdrawal_options_json JSON 직렬화. 기본값과 동일하면 {@code null} 반환하여
     * 컬럼 적재 시 NULL 유지 (storage 효율 + idempotent 비교).
     *
     * @return JSON 문자열 또는 {@code null}
     */
    public String toJsonOrNull() {
        if (!deleteCommunityBody) {
            return null;
        }
        return "{\"deleteCommunityBody\":true}";
    }

    /**
     * users.withdrawal_options_json 역직렬화. 어떤 실패에도 {@link #defaults()} 로
     * 폴백한다 (운영 데이터의 NULL/legacy/이상값 보호).
     *
     * @param json JSON 문자열 (null 가능)
     * @return parsed 옵션 또는 기본값
     */
    public static WithdrawalOptions fromJsonOrDefaults(String json) {
        if (json == null) {
            return DEFAULTS;
        }
        String trimmed = json.trim();
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
            return DEFAULTS;
        }
        // 정공법 parser 없이 단순 substring 검사 — 본 VO 는 단일 boolean key 만 사용.
        // 향후 옵션 확장 시 ObjectMapper 도입을 검토.
        String normalized = trimmed.replaceAll("\\s+", "");
        if (normalized.contains("\"deleteCommunityBody\":true")) {
            return new WithdrawalOptions(true);
        }
        return DEFAULTS;
    }

    public boolean isDeleteCommunityBody() {
        return deleteCommunityBody;
    }

    @Override
    public String toString() {
        return "WithdrawalOptions{deleteCommunityBody=" + deleteCommunityBody + '}';
    }
}
