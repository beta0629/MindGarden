package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 SMS 템플릿 테넌트 override 저장 요청.
 *
 * <p>{@code content} 는 {@code {{varName}}} 변수 자리표시자를 그대로 포함해야 한다.
 * 전역 본문 수정은 본 API 로 불가능하며, Flyway 마이그레이션으로만 변경한다(SSOT).
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsTemplateUpdateRequest {

    @NotBlank(message = "본문은 필수 입력입니다.")
    @Size(max = 500, message = "SMS 본문은 최대 500자까지 가능합니다.")
    private String content;
}
