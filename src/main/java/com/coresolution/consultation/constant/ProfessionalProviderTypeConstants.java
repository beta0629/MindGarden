package com.coresolution.consultation.constant;

/**
 * 테넌트 공통코드 그룹 {@code PROFESSIONAL_PROVIDER_TYPE} 및 기본 code_value 상수.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
public final class ProfessionalProviderTypeConstants {

    private ProfessionalProviderTypeConstants() {
    }

    /** 공통코드 그룹명 (테넌트 스코프). */
    public static final String CODE_GROUP = "PROFESSIONAL_PROVIDER_TYPE";

    /** 온보딩·마이그레이션 기본 유형 (상담사). */
    public static final String DEFAULT_TYPE_CODE_VALUE = "DEFAULT_COUNSELOR";

    /** 레거시 놀이치료 사용자 백필용 code_value. */
    public static final String LEGACY_PLAY_TYPE_CODE_VALUE = "PLAY_THERAPY";

    /** 레거시 언어치료 사용자 백필용 code_value. */
    public static final String LEGACY_SPEECH_TYPE_CODE_VALUE = "SPEECH_THERAPY";

    /** {@code extra_data} JSON 키: Spring 권한에 매핑할 {@link UserRole} 이름. */
    public static final String EXTRA_KEY_SYSTEM_AUTHORITY_ROLE = "systemAuthorityRole";

    /** {@code extra_data} JSON 키: 기본 선택 유형 여부. */
    public static final String EXTRA_KEY_IS_DEFAULT = "isDefault";
}
