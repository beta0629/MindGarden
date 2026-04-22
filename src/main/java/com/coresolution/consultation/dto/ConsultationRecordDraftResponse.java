package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담일지 서버 초안 API 응답.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRecordDraftResponse {

    private boolean hasDraft;

    private Long id;

    private Long consultationId;

    private Long consultantId;

    private String payloadJson;

    private Long version;

    private LocalDateTime updatedAt;

    /**
     * 초안 없음 응답.
     *
     * @param consultationId 상담(스케줄) ID
     * @param consultantId 상담사 ID
     * @return 빈 응답
     */
    public static ConsultationRecordDraftResponse empty(Long consultationId, Long consultantId) {
        return ConsultationRecordDraftResponse.builder()
                .hasDraft(false)
                .consultationId(consultationId)
                .consultantId(consultantId)
                .build();
    }
}
