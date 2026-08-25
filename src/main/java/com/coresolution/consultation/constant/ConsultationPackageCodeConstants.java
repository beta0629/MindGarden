package com.coresolution.consultation.constant;

/**
 * 상담 패키지(CONSULTATION_PACKAGE) 코드 자동 발급 상수.
 *
 * @author MindGarden
 * @since 2026-08-25
 */
public final class ConsultationPackageCodeConstants {

    /** 테넌트 공통코드 그룹명. */
    public static final String CODE_GROUP = "CONSULTATION_PACKAGE";

    /** 자동 발급 코드 접두사 (예: PACKAGE_001). */
    public static final String CODE_PREFIX = "PACKAGE";

    /** 시퀀스 자릿수. */
    public static final int CODE_SEQ_WIDTH = 3;

    /** 자동 발급 충돌 시 최대 재시도. */
    public static final int GENERATION_MAX_ATTEMPTS = 5;

    public static final String DUPLICATE_CODE_MESSAGE_FMT = "이미 존재하는 코드입니다: %s.%s";

    public static final String CODE_VALUE_REQUIRED_MESSAGE = "코드 값은 필수입니다.";

    public static final String AUTO_GENERATION_FAILED_MESSAGE =
            "패키지 코드 자동 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.";

    private ConsultationPackageCodeConstants() {
    }
}
