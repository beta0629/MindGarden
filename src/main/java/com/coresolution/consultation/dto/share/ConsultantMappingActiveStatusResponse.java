package com.coresolution.consultation.dto.share;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * 내담자 본인의 활성 상담사 매핑 — 마음 날씨·무드 저널 공유 사전 가드용 응답.
 *
 * <p>{@code GET /api/v1/clients/me/consultant-mappings/active} 응답 본문.
 * PII 미포함 (mappingId / consultantId / status 만).</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConsultantMappingActiveStatusResponse {

    /** 공유 가능한 매핑(ACTIVE 또는 SESSIONS_EXHAUSTED)이 1건 이상 존재하는지. */
    boolean hasActiveMapping;

    /** 공유 가능한 매핑 요약 목록. */
    List<ConsultantMappingSummary> mappings;

    /**
     * 공유 가능한 단일 매핑 요약 — PK·상담사 PK·status 만.
     */
    @Value
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConsultantMappingSummary {
        Long mappingId;
        Long consultantId;
        String status;
    }
}
