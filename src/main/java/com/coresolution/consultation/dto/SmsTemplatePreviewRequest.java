package com.coresolution.consultation.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 SMS 템플릿 미리보기 요청.
 *
 * <p>{@code variables} 의 값으로 {@code {{varName}}} 자리표시자를 치환한 결과를
 * 반환한다. 누락 변수는 빈 문자열로 처리한다.
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsTemplatePreviewRequest {

    /** 변수 입력 (key = 변수명, value = 치환 값). */
    private Map<String, String> variables;

    /** true 이면 테넌트 override 본문, false 이면 전역 본문 기준. 기본 true. */
    private Boolean preferTenantOverride;
}
