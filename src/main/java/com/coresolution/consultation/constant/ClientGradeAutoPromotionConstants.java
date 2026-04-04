package com.coresolution.consultation.constant;

/**
 * 내담자 등급 자동 승급 배치용 상수 (common_codes 그룹명·JSON 키).
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
public final class ClientGradeAutoPromotionConstants {

    /** common_codes.code_group — 내담자 등급 메타(시드의 CLIENT_* + min_sessions 등) */
    public static final String CODE_GROUP_CLIENT_GRADE = "CLIENT_GRADE";

    /** common_codes.code_group — USER_GRADE 그룹에 CLIENT_* 행이 있으면 동일 규칙으로 병합 */
    public static final String CODE_GROUP_USER_GRADE = "USER_GRADE";

    /** extra_data JSON에서 최소 완료 회기 임계로 사용하는 키 */
    public static final String EXTRA_DATA_KEY_MIN_SESSIONS = "min_sessions";

    /** 자동 승급 규칙에 포함할 code_value 접두사 */
    public static final String CLIENT_GRADE_CODE_PREFIX = "CLIENT_";

    private ClientGradeAutoPromotionConstants() {
    }
}
