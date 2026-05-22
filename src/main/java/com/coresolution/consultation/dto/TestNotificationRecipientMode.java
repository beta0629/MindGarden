package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * 어드민 테스트 발송 수신자 선택 모드.
 *
 * <p>기획서 §4.X C3({@code self_plus_db})에 따라 백엔드는 {@link #SELF}/{@link #USER} 만 허용한다.
 * {@code PHONE} 등 미지원 값은 {@link #fromJson(String)}이 null을 반환해 {@code @NotNull} Bean Validation이
 * 400 Bad Request를 발생시키도록 한다(controller에서 500 누수 차단).
 *
 * @author MindGarden
 * @since 2026-05-22
 */
public enum TestNotificationRecipientMode {
    /** 본인(현재 로그인 사용자)에게 발송. */
    SELF,
    /** 현재 테넌트의 DB 사용자에게 발송. */
    USER;

    /**
     * Jackson 역직렬화 진입점. 알 수 없는 값(예: {@code PHONE})은 null로 반환하여
     * 요청 검증 단계에서 400으로 처리한다.
     *
     * @param value JSON 문자열
     * @return enum 또는 null(미지원 값)
     */
    @JsonCreator
    public static TestNotificationRecipientMode fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (TestNotificationRecipientMode mode : values()) {
            if (mode.name().equalsIgnoreCase(value.trim())) {
                return mode;
            }
        }
        return null;
    }
}
