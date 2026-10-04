package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ConsultationRecordAccessLog;
import lombok.Builder;
import lombok.Getter;

/**
 * 상담일지 열람 감사 로그 응답 항목.
 *
 * <p>IP·User-Agent 는 해시만 저장되므로 원문을 돌려줄 수 없고, 해시 존재 여부만 노출한다.
 * 상담일지 본문은 어떤 필드에도 담기지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Getter
@Builder
public class ConsultationRecordAccessLogResponse {

    private final Long id;
    private final Long recordId;
    private final String recordKind;
    private final Long clientId;
    private final Long authorConsultantId;
    private final Long actorId;
    private final String actorRole;
    private final String action;
    private final String result;
    private final String denialReason;
    private final String ipHash;
    private final String userAgentHash;
    private final LocalDateTime accessedAt;

    /**
     * 엔티티 → 응답 항목.
     *
     * @param entity 감사 로그 엔티티
     * @return 응답 항목
     */
    public static ConsultationRecordAccessLogResponse fromEntity(ConsultationRecordAccessLog entity) {
        return ConsultationRecordAccessLogResponse.builder()
                .id(entity.getId())
                .recordId(entity.getRecordId())
                .recordKind(entity.getRecordKind())
                .clientId(entity.getClientId())
                .authorConsultantId(entity.getAuthorConsultantId())
                .actorId(entity.getActorId())
                .actorRole(entity.getActorRole())
                .action(entity.getAction())
                .result(entity.getResult())
                .denialReason(entity.getDenialReason())
                .ipHash(entity.getIpHash())
                .userAgentHash(entity.getUserAgentHash())
                .accessedAt(entity.getAccessedAt())
                .build();
    }
}
