package com.coresolution.consultation.service.ai;

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
        String errorMessage
) {
    /**
     * @return 성공이고 본문이 비어 있지 않은지
     */
    public boolean hasUsableText() {
        return success && text != null && !text.isBlank();
    }
}
