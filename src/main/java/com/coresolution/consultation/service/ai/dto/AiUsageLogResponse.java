package com.coresolution.consultation.service.ai.dto;

import com.coresolution.consultation.entity.AiUsageLog;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 사용 로그 응답 DTO (어드민 AI 프로바이더 관리 페이지 — 로그 테이블 row).
 *
 * <p>트랙 B PR-4 (2026-05-24): 디자이너 §5 — 호출 로그 목록 행 1건.
 * promptPreview / responsePreview 는 미지원 (entity 에 prompt/response 컬럼 부재) — 향후 확장 예정.</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLogResponse {

    /** 로그 PK */
    private Long id;

    /** 추정 provider 라벨 (OPENAI / GEMINI / CLAUDE / REPLICATE / UNKNOWN — model prefix 기반) */
    private String aiProvider;

    /** caller (requestType — wellness / healing / psych 등) */
    private String requestType;

    /** 사용된 모델 명 (gpt-4o-mini 등) */
    private String model;

    /** 성공/실패 (success | failed) */
    private String status;

    /** 응답 시간(ms). 없으면 null. */
    private Long durationMs;

    /** 토큰 총합. null 가능. */
    private Integer tokenCount;

    /** 실패 시 에러 메시지 (앞 200자 트림). 성공이면 null. */
    private String errorMessage;

    /** 호출 시각 */
    private LocalDateTime createdAt;

    /** 호출자 ID (감사 로그용) */
    private String requestedBy;

    /**
     * Entity → Response 변환. provider 라벨은 호출자에서 주입.
     *
     * @param entity   원본 엔티티
     * @param provider 추정 provider 라벨 (대문자)
     */
    public static AiUsageLogResponse fromEntity(AiUsageLog entity, String provider) {
        if (entity == null) {
            return null;
        }
        String errorPreview = entity.getErrorMessage();
        if (errorPreview != null && errorPreview.length() > 200) {
            errorPreview = errorPreview.substring(0, 200) + "...";
        }
        return AiUsageLogResponse.builder()
                .id(entity.getId())
                .aiProvider(provider)
                .requestType(entity.getRequestType())
                .model(entity.getModel())
                .status(Boolean.FALSE.equals(entity.getIsSuccess()) ? "failed" : "success")
                .durationMs(entity.getResponseTimeMs())
                .tokenCount(entity.getTotalTokens())
                .errorMessage(errorPreview)
                .createdAt(entity.getCreatedAt())
                .requestedBy(entity.getRequestedBy())
                .build();
    }
}
