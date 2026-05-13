package com.coresolution.consultation.service.ai;

/**
 * 시스템 설정의 기본 AI 프로바이더에 따라 OpenAI Chat Completions 또는 Gemini {@code generateContent}로
 * 텍스트 응답을 반환한다. Claude/Replicate는 본 서비스에서 전용 프로토콜을 쓰지 않고 openai→gemini 순으로 폴백한다.
 *
 * @author CoreSolution
 * @since 2026-05-13
 */
public interface AiChatCompletionService {

    /**
     * 시스템·유저 메시지로 채팅 완성 텍스트를 조회한다.
     *
     * @param systemPrompt 시스템 역할 프롬프트
     * @param userPrompt 사용자 프롬프트
     * @param maxTokens 최대 출력 토큰(상한)
     * @param temperature 샘플링 온도
     * @param geminiJsonResponseMimeType Gemini일 때 {@code responseMimeType=application/json} 적용 여부(웰니스 JSON 파싱 안정화용)
     * @return 결과(실패 시 success=false 및 errorMessage)
     */
    AiChatCompletionResult completeChat(
            String systemPrompt,
            String userPrompt,
            int maxTokens,
            double temperature,
            boolean geminiJsonResponseMimeType
    );
}
