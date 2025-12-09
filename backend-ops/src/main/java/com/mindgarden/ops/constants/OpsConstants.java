package com.mindgarden.ops.constants;

/**
 * Ops Portal 상수 정의
 * 하드코딩 금지 원칙에 따라 모든 상수값을 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 */
public final class OpsConstants {

    private OpsConstants() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * 기본 업종 코드
     * TODO: 향후 공통코드 시스템 연동 시 제거 예정
     * 현재는 환경 변수나 설정값으로 관리 가능하도록 상수로 분리
     */
    public static final String DEFAULT_BUSINESS_TYPE = "CONSULTATION";

    /**
     * 업종 코드 그룹명 (공통코드 시스템 연동 시 사용)
     */
    public static final String BUSINESS_TYPE_CODE_GROUP = "BUSINESS_TYPE";

    /**
     * 온보딩 상태 코드 그룹명
     */
    public static final String ONBOARDING_STATUS_CODE_GROUP = "ONBOARDING_STATUS";

    /**
     * 리스크 레벨 코드 그룹명
     */
    public static final String RISK_LEVEL_CODE_GROUP = "RISK_LEVEL";
}

