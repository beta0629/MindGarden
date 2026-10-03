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

    public static final String MSG_TENANT_CONTEXT_MISSING =
            "테넌트 정보를 확인할 수 없어 조회할 수 없습니다.";

    /**
     * 테넌트 센터 프로필(전화·이메일·주소)이 비어 있을 때 노출하는 안내.
     *
     * <p>P1 보안(2026-10-03): 특정 테넌트 연락처 하드코딩을 제거했으므로 값이 없으면
     * 공백 + 본 안내만 노출한다 (마인드가든 값 폴백 금지).
     */
    public static final String MSG_CENTER_PROFILE_REQUIRED =
            "센터 정보를 입력해 주세요";

    /**
     * 실측 점검 데이터가 없는 준수 항목 상태.
     *
     * <p>P1 보안(2026-10-03): 모든 항목을 {@code true} 로 고정 반환해 미점검 항목이
     * 준수로 보이던 문제를 제거한다.
     */
    public static final String STATUS_NOT_REVIEWED =
            "미점검";

    /**
     * 테넌트가 등록한 유출(침해사고) 대응 체계가 없을 때 노출하는 빈 상태 안내.
     *
     * <p>고정 대응팀 구성원·4단계 대응 절차 표본을 제거했으므로
     * 등록 데이터가 없으면 빈 목록 + 본 안내만 응답한다.
     */
    public static final String MSG_BREACH_RESPONSE_NOT_REGISTERED =
            "유출 대응 체계를 등록해 주세요";

    private ComplianceServiceErrorMessages() {
    }
}
