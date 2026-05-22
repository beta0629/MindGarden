package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 테스트 발송 — 카카오 알림톡 템플릿 메타 DTO.
 *
 * <p>코드 enum 출처(공통코드 {@code ALIMTALK_TEMPLATE})와 솔라피 실시간 출처 모두에서 사용된다(C4 {@code both_hybrid}).
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestNotificationAlimtalkTemplate {

    private String templateCode;
    private String title;
    /** 검수 상태(공통코드 출처는 null, 솔라피 출처는 APPROVED 등). */
    private String status;
    /** 변수 메타. */
    private List<Variable> variables;
    /** 출처 — {@code COMMON_CODE} 또는 {@code SOLAPI}. */
    private String source;
    /**
     * 템플릿 본문(미리보기·변수 매칭 진단용, null 가능).
     *
     * <p>{@code SOLAPI} 출처는 솔라피 응답 {@code content} 그대로,
     * {@code COMMON_CODE} 출처는 {@code extra_data.template} 값. 어드민 도구가 어떤 변수를
     * 채워야 하는지 직관 이해할 수 있도록 변수 입력 폼 위쪽 영역에 노출한다.
     */
    private String content;
    /**
     * Solapi 실제 {@code templateId} 매핑 존재 여부.
     *
     * <p>{@code COMMON_CODE} 출처 옵션에 대해 공통코드 그룹 {@code ALIMTALK_BIZ_TEMPLATE_CODE}
     * 의 {@code codeLabel}(={@code KA01TP…})이 채워져 있으면 {@code true}. 비어 있으면
     * 어드민 도구에서 "매핑없음" 뱃지를 표시하고 발송도 백엔드에서 차단된다.
     *
     * <p>{@code SOLAPI} 출처는 항상 {@code true}(사용자가 실 templateId 를 선택).
     */
    private boolean solapiTemplateIdPresent;

    /**
     * 알림톡 템플릿 변수 메타.
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Variable {
        private String name;
        private boolean required;
        private String sampleValue;
    }
}
