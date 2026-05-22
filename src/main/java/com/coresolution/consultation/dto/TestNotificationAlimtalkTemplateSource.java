package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * 어드민 알림톡 발송 도구 — 템플릿 출처 enum.
 *
 * <p>{@link #COMMON_CODE} 는 백엔드가 공통코드 그룹 {@code ALIMTALK_BIZ_TEMPLATE_CODE} 에서
 * codeValue → 실 Solapi {@code templateId} 로 매핑 후 송신한다(매핑 없음 시 차단).
 * {@link #SOLAPI} 는 사용자가 어드민 UI '솔라피 전체 보기' 에서 이미 실 templateId 를 선택한 상태이므로
 * 매핑 lookup 을 건너뛴다.
 *
 * <p>{@link AdminTestNotificationServiceImpl} 의 {@code SOURCE_*} 문자열 상수와 동일 값을 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public enum TestNotificationAlimtalkTemplateSource {
    /** 공통코드(ALIMTALK_TEMPLATE) — 백엔드에서 매핑 lookup 후 송신. */
    COMMON_CODE,
    /** 솔라피 라이브 — 이미 실 templateId 가 선택된 상태로 매핑 lookup 생략. */
    SOLAPI;

    /**
     * Jackson 역직렬화 진입점. 알 수 없는 값은 {@code null} 로 반환하여 {@code @NotNull} 검증이
     * 400 Bad Request 를 발생시키도록 한다.
     *
     * @param value JSON 문자열
     * @return enum 또는 {@code null}
     */
    @JsonCreator
    public static TestNotificationAlimtalkTemplateSource fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (TestNotificationAlimtalkTemplateSource src : values()) {
            if (src.name().equalsIgnoreCase(value.trim())) {
                return src;
            }
        }
        return null;
    }
}
