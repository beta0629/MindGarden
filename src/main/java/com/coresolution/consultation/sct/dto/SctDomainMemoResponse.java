package com.coresolution.consultation.sct.dto;

import java.time.LocalDateTime;
import com.coresolution.consultation.sct.entity.SctDomainMemo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 영역 메모 응답.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctDomainMemoResponse {

    private Long id;
    private Long invitationId;
    private String domainCode;
    private String memoText;
    private Long authorUserId;
    private LocalDateTime updatedAt;

    /**
     * 엔티티 → 응답.
     *
     * @param entity 메모
     * @return 응답
     */
    public static SctDomainMemoResponse fromEntity(SctDomainMemo entity) {
        if (entity == null) {
            return null;
        }
        return SctDomainMemoResponse.builder()
                .id(entity.getId())
                .invitationId(entity.getInvitationId())
                .domainCode(entity.getDomainCode())
                .memoText(entity.getMemoText())
                .authorUserId(entity.getAuthorUserId())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
