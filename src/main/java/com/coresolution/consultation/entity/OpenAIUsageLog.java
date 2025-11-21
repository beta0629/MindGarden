package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OpenAI API 사용 로그 엔티티
 * - API 호출 내역 및 비용 추적
 * - 월별 사용량 통계
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Entity
@Table(name = "openai_usage_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenAIUsageLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 요청 타입 (wellness, chat, analysis 등)
     */
    @Column(name = "request_type", length = 50)
    private String requestType;
    
    /**
     * 사용된 모델 (gpt-3.5-turbo, gpt-4 등)
     */
    @Column(length = 50)
    private String model;
    
    /**
     * 프롬프트 토큰 수
     */
    @Column(name = "prompt_tokens")
    private Integer promptTokens;
    
    /**
     * 완성 토큰 수
     */
    @Column(name = "completion_tokens")
    private Integer completionTokens;
    
    /**
     * 총 토큰 수
     */
    @Column(name = "total_tokens")
    private Integer totalTokens;
    
    /**
     * 예상 비용 (USD)
     */
    @Column(name = "estimated_cost")
    private Double estimatedCost;
    
    /**
     * 성공 여부
     */
    @Column(name = "is_success")
    private Boolean isSuccess;
    
    /**
     * 에러 메시지 (실패 시)
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    /**
     * 응답 시간 (ms)
     */
    @Column(name = "response_time_ms")
    private Long responseTimeMs;
    
    /**
     * 요청 사용자 (관리자 ID)
     */
    @Column(name = "requested_by", length = 100)
    private String requestedBy;
    
    /**
     * 생성 일시
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isSuccess == null) {
            isSuccess = true;
        }
    }
    
    /**
     * 비용 계산 (gpt-3.5-turbo 기준)
     * Input: $0.0015 / 1K tokens
     * Output: $0.002 / 1K tokens
     */
    public void calculateCost() {
        if (promptTokens != null && completionTokens != null) {
            double inputCost = (promptTokens / 1000.0) * 0.0015;
            double outputCost = (completionTokens / 1000.0) * 0.002;
            this.estimatedCost = inputCost + outputCost;
        }
    }
}

