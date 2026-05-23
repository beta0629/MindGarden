package com.coresolution.consultation.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 채팅 완성 요청 DTO — SSOT 단일 진입점용.
 *
 * @author CoreSolution
 * @since 2026-05-23
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCompletionRequest {

    private String systemPrompt;
    private String userPrompt;
    private Integer maxTokens;
    private Double temperature;
    private AiResponseFormat responseFormat;
    private String requestedProvider;
    private String traceId;
    private String tenantId;
    private String callerId;

    /**
     * @return maxTokens 또는 기본값 800
     */
    public Integer getMaxTokensOrDefault() {
        return maxTokens != null ? maxTokens : 800;
    }

    /**
     * @return temperature 또는 기본값 0.7
     */
    public Double getTemperatureOrDefault() {
        return temperature != null ? temperature : 0.7;
    }

    /**
     * @return responseFormat 또는 기본값 TEXT
     */
    public AiResponseFormat getResponseFormatOrDefault() {
        return responseFormat != null ? responseFormat : AiResponseFormat.TEXT;
    }
}
