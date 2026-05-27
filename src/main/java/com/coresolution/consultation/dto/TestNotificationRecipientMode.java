package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * 어드민 테스트 발송 수신자 선택 모드.
 *
 * <p>현행 정책 (2026-05-27 정정):
 * <ul>
 *   <li>{@link #SELF} — 본인(현재 로그인 사용자)에게 발송.</li>
 *   <li>{@link #USER} — 현재 테넌트의 DB 사용자에게 발송.</li>
 *   <li>{@link #PHONE} — 어드민이 임의 전화번호 직접 입력. 목록 외 수신자 지원.
 *       어드민 권한자({@code ADMIN}/{@code STAFF})만 호출 가능
 *       (컨트롤러 {@code @PreAuthorize}로 enforce).</li>
 * </ul>
 *
 * <p>이전 정책({@code C3=self_plus_db}, PHONE 차단)에서 사용자 요청
 * (2026-05-27)에 따라 PHONE 모드를 정상 허용으로 전환했다. 수신자 검증 분기는
 * 서비스 {@code resolveRecipient}가 담당하며, {@link #fromJson(String)}은 알 수 없는
 * 값(예: 오타)만 null로 반환해 Bean Validation이 400 Bad Request를 내도록 한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
public enum TestNotificationRecipientMode {
    /** 본인(현재 로그인 사용자)에게 발송. */
    SELF,
    /** 현재 테넌트의 DB 사용자에게 발송. */
    USER,
    /**
     * 어드민이 임의 전화번호 직접 입력 (목록 외 수신자 지원).
     *
     * <p>한국 휴대폰 11자리만 허용. 서비스 레이어에서
     * {@code LoginIdentifierUtils.normalizeAndValidateKoreanMobileForSms}로 정규화·검증한다.
     */
    PHONE;

    /**
     * Jackson 역직렬화 진입점. 알 수 없는 값(오타 등)은 null로 반환하여
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
