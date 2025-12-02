package com.coresolution.core.service.ai;

import java.util.Map;

/**
 * AI 모델 제공자 인터페이스
 * 다양한 AI 모델(OpenAI, Claude, Gemini 등)을 지원하기 위한 추상화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
public interface AIModelProvider {
    
    /**
     * AI 모델 이름 반환
     */
    String getModelName();
    
    /**
     * AI 모델 타입 반환 (OPENAI, CLAUDE, GEMINI 등)
     */
    String getModelType();
    
    /**
     * AI 분석 실행
     * 
     * @param systemPrompt 시스템 프롬프트 (역할 정의)
     * @param userPrompt 사용자 프롬프트 (분석 요청)
     * @param maxTokens 최대 토큰 수
     * @param temperature 온도 (0.0-1.0)
     * @return AI 응답
     */
    AIResponse analyze(String systemPrompt, String userPrompt, int maxTokens, double temperature);
    
    /**
     * 사용 가능 여부 확인
     */
    boolean isAvailable();
    
    /**
     * AI 응답 DTO
     */
    class AIResponse {
        private final String content;
        private final int promptTokens;
        private final int completionTokens;
        private final int totalTokens;
        private final long responseTimeMs;
        private final boolean success;
        private final String errorMessage;
        
        public AIResponse(String content, int promptTokens, int completionTokens, 
                         int totalTokens, long responseTimeMs) {
            this.content = content;
            this.promptTokens = promptTokens;
            this.completionTokens = completionTokens;
            this.totalTokens = totalTokens;
            this.responseTimeMs = responseTimeMs;
            this.success = true;
            this.errorMessage = null;
        }
        
        public AIResponse(String errorMessage, long responseTimeMs) {
            this.content = null;
            this.promptTokens = 0;
            this.completionTokens = 0;
            this.totalTokens = 0;
            this.responseTimeMs = responseTimeMs;
            this.success = false;
            this.errorMessage = errorMessage;
        }
        
        public String getContent() { return content; }
        public int getPromptTokens() { return promptTokens; }
        public int getCompletionTokens() { return completionTokens; }
        public int getTotalTokens() { return totalTokens; }
        public long getResponseTimeMs() { return responseTimeMs; }
        public boolean isSuccess() { return success; }
        public String getErrorMessage() { return errorMessage; }
    }
}

