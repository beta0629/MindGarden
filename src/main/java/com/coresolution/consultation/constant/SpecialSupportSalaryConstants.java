package com.coresolution.consultation.constant;

/**
 * 테넌트 공통코드 그룹 {@code SPECIAL_SUPPORT_SALARY} 및 {@code extra_data} JSON 키.
 * 금액·최소 회기 수 값은 DB 시드·공통코드에만 두고 애플리케이션에 하드코딩하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
public final class SpecialSupportSalaryConstants {

    private SpecialSupportSalaryConstants() {
    }

    /** 공통코드 그룹 (테넌트 스코프 시드 + 코어 폴백 가능). */
    public static final String CODE_GROUP = "SPECIAL_SUPPORT_SALARY";

    /** 그룹 내 기본 설정 행 {@code code_value}. */
    public static final String CODE_VALUE_DEFAULT = "DEFAULT";

    /** {@code extra_data} JSON: 매핑 1건당 지급액(원). */
    public static final String EXTRA_KEY_AMOUNT = "amount";

    /** {@code extra_data} JSON: 누적 회기 최소치(이상일 때 지급 대상). */
    public static final String EXTRA_KEY_MIN_SESSIONS = "minSessions";

    /**
     * {@code extra_data} JSON: true면 {@code consultant_client_mappings.payment_status} 가
     * 유료 확정 계열(CONFIRMED, PAY, DEP, APPROVED)일 때만 지급. false/미설정 시 기획 변경에 맞게 SP에서 해석.
     */
    public static final String EXTRA_KEY_REQUIRE_PAID_CONFIRMATION = "requirePaidConfirmation";
}
