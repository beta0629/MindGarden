package com.coresolution.consultation.constant;

/**
 * OTP 발송 목적 — push 페이로드 {@code data.purpose} · SMS 본문 prefix · 감사 로그 메타 분류에 사용.
 *
 * <p>{@link com.coresolution.consultation.service.OtpDeliveryService#deliver} 호출자가 지정한다.
 * 코드 문자열은 expo-app 푸시 핸들러({@code data.purpose}) 와 동일한 SSOT 로,
 * 클라이언트 분기·BI 통계에서도 그대로 재사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public enum OtpPurpose {

    /** 로그인 / 비밀번호 찾기 등 인증 흐름의 휴대전화 본인확인. */
    LOGIN_VERIFICATION("login_verification"),

    /** 마이페이지 휴대전화 변경(Phase A) — 새 번호 OTP 검증. */
    PHONE_CHANGE("phone_change"),

    /** 회원가입 단계 — 신규 휴대전화 본인확인. */
    SIGNUP_VERIFICATION("signup_verification"),

    /** 기타 일반 본인확인(특정 목적 미지정). */
    GENERIC("generic");

    private final String code;

    OtpPurpose(String code) {
        this.code = code;
    }

    /**
     * @return push payload {@code data.purpose} 등에 적재되는 코드 문자열
     */
    public String getCode() {
        return code;
    }
}
