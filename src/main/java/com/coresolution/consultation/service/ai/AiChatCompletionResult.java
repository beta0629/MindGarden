package com.coresolution.consultation.service.ai;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 활성 AI 프로바이더 기준 채팅 완성 호출 결과.
 *
 * @param success 호출 성공 여부
 * @param text 모델 본문(빈 문자열 가능)
 * @param requestedProviderId {@link com.coresolution.consultation.service.SystemConfigService#getAiDefaultProvider()} 값
 * @param effectiveProviderId 실제 호출에 사용된 프로바이더({@code openai} 또는 {@code gemini})
 * @param model 사용한 모델 식별 문자열(로깅용)
 * @param promptTokens 프롬프트 토큰(OpenAI usage 또는 Gemini usageMetadata)
 * @param completionTokens 완성 토큰
 * @param totalTokens 합계 토큰
 * @param errorMessage 실패 시 사유
 * @param isFallback 요청 프로바이더와 실제 프로바이더가 다른 경우 true
 * @param parsedJson responseFormat=JSON 시 파서가 채운 JsonNode (옵션)
 * @author CoreSolution
 * @since 2026-05-13
 */
public record AiChatCompletionResult(
        boolean success,
        String text,
        String requestedProviderId,
        String effectiveProviderId,
        String model,
        int promptTokens,
        int completionTokens,
        int totalTokens,
        String errorMessage,
        boolean isFallback,
        JsonNode parsedJson
) {
    /**
     * 기존 9-필드 생성자 — backward-compatible (isFallback=false, parsedJson=null).
     */
    public AiChatCompletionResult(
            boolean success,
            String text,
            String requestedProviderId,
            String effectiveProviderId,
            String model,
            int promptTokens,
            int completionTokens,
            int totalTokens,
            String errorMessage) {
        this(success, text, requestedProviderId, effectiveProviderId, model,
                promptTokens, completionTokens, totalTokens, errorMessage, false, null);
    }

    /**
     * @return 성공이고 본문이 비어 있지 않은지
     */
    public boolean hasUsableText() {
        return success && text != null && !text.isBlank();
    }

    /**
     * @return 요청 프로바이더 (requestedProviderId 별칭)
     */
    public String requestedProvider() {
        return requestedProviderId;
    }

    /**
     * @return 실제 사용 프로바이더 (effectiveProviderId 별칭)
     */
    public String effectiveProvider() {
        return effectiveProviderId;
    }
}
