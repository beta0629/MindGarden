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
