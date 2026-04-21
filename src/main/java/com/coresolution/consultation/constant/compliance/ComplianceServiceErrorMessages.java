package com.coresolution.consultation.constant.compliance;

/**
 * {@code ComplianceService}의 {@code result.put("error", ...)} 에 사용하는 메시지.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class ComplianceServiceErrorMessages {

    public static final String MSG_PERSONAL_DATA_PROCESSING_STATUS_QUERY_FAILED =
            "개인정보 처리 현황 조회에 실패했습니다.";

    public static final String MSG_PERSONAL_DATA_IMPACT_ASSESSMENT_QUERY_FAILED =
            "개인정보 영향평가 조회에 실패했습니다.";

    public static final String MSG_PERSONAL_DATA_BREACH_RESPONSE_STATUS_QUERY_FAILED =
            "개인정보 침해사고 대응 현황 조회에 실패했습니다.";

    public static final String MSG_PERSONAL_DATA_PROTECTION_EDUCATION_STATUS_QUERY_FAILED =
            "개인정보보호 교육 현황 조회에 실패했습니다.";

    public static final String MSG_PERSONAL_DATA_PROCESSING_POLICY_STATUS_QUERY_FAILED =
            "개인정보 처리방침 현황 조회에 실패했습니다.";

    public static final String MSG_COMPLIANCE_OVERALL_STATUS_QUERY_FAILED =
            "컴플라이언스 종합 현황 조회에 실패했습니다.";

    private ComplianceServiceErrorMessages() {
    }
}
