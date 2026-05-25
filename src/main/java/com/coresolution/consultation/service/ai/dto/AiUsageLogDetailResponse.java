package com.coresolution.consultation.service.ai.dto;

import com.coresolution.consultation.entity.AiUsageLog;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 사용 로그 상세 응답 DTO (모달용 전체 본문).
 *
 * <p>트랙 B PR-4 (2026-05-24): 디자이너 §5 — 로그 상세 모달.</p>
 *
 * <p>2026-05-25 N3 보강 (V20260529_001): {@code prompt}/{@code response} 컬럼이 엔티티에 신설되어
 * {@link #promptBody}/{@link #responseBody} 로 전체 본문 노출. {@code aiProvider} 는 entity 컬럼을
 * 직접 사용 (model prefix 추정 제거).</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLogDetailResponse {

    private Long id;

    /** 실제 호출 provider 라벨 (OPENAI / GEMINI / CLAUDE / REPLICATE / UNKNOWN) — entity 컬럼 직접 사용 */
    private String aiProvider;

    /** caller (requestType) */
    private String requestType;

    /** 사용된 모델 명 */
    private String model;

    /** 성공/실패 */
    private String status;

    /** 응답 시간(ms) */
    private Long durationMs;

    /** prompt 토큰 */
    private Integer promptTokens;

    /** completion 토큰 */
    private Integer completionTokens;

    /** 총 토큰 */
    private Integer totalTokens;

    /** 예상 비용(USD) */
    private Double estimatedCost;

    /** 에러 메시지 전체 본문 (성공이면 null) */
    private String errorMessage;

    /** 호출 시각 */
    private LocalDateTime createdAt;

    /** 호출자 */
    private String requestedBy;

    /**
     * AI 호출 시 사용한 system + user 결합 프롬프트 본문 (V20260529_001). 기존 행은 null.
     */
    private String promptBody;

    /**
     * AI 응답 본문 (성공 시, V20260529_001). 실패/기존 행은 null.
     */
    private String responseBody;

    public static AiUsageLogDetailResponse fromEntity(AiUsageLog entity) {
        if (entity == null) {
            return null;
        }
        return AiUsageLogDetailResponse.builder()
                .id(entity.getId())
                .aiProvider(AiUsageLogResponse.normalizeProvider(entity.getAiProvider()))
                .requestType(entity.getRequestType())
                .model(entity.getModel())
                .status(Boolean.FALSE.equals(entity.getIsSuccess()) ? "failed" : "success")
                .durationMs(entity.getResponseTimeMs())
                .promptTokens(entity.getPromptTokens())
                .completionTokens(entity.getCompletionTokens())
                .totalTokens(entity.getTotalTokens())
                .estimatedCost(entity.getEstimatedCost())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .requestedBy(entity.getRequestedBy())
                .promptBody(entity.getPrompt())
                .responseBody(entity.getResponse())
                .build();
    }
}
