package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ClientScheduleNote;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자 스케줄 특이사항 API 응답. 프론트는 문자열·숫자 원시값으로 매핑 후 렌더.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientScheduleNoteResponse {

    private String id;
    private String tenantId;
    private String clientId;
    private String mappingId;
    private String scheduleId;
    private String occurrenceKey;
    private String noteType;
    private String title;
    private String body;
    private String promiseDate;
    private String amount;
    private String currency;
    private String createdBy;
    private String updatedBy;
    private String createdAt;
    private String updatedAt;
    private String deletedAt;
    private String isDeleted;

    /**
     * 엔티티를 API 응답으로 변환.
     *
     * @param entity 노트 엔티티
     * @return 응답 DTO
     */
    public static ClientScheduleNoteResponse fromEntity(ClientScheduleNote entity) {
        if (entity == null) {
            return null;
        }
        return ClientScheduleNoteResponse.builder()
                .id(toStr(entity.getId()))
                .tenantId(entity.getTenantId())
                .clientId(toStr(entity.getClientId()))
                .mappingId(toStr(entity.getMappingId()))
                .scheduleId(toStr(entity.getScheduleId()))
                .occurrenceKey(entity.getOccurrenceKey())
                .noteType(entity.getNoteType())
                .title(entity.getTitle())
                .body(entity.getBody())
                .promiseDate(formatDate(entity.getPromiseDate()))
                .amount(formatAmount(entity.getAmount()))
                .currency(entity.getCurrency())
                .createdBy(toStr(entity.getCreatedBy()))
                .updatedBy(toStr(entity.getUpdatedBy()))
                .createdAt(formatDateTime(entity.getCreatedAt()))
                .updatedAt(formatDateTime(entity.getUpdatedAt()))
                .deletedAt(formatDateTime(entity.getDeletedAt()))
                .isDeleted(entity.getIsDeleted() != null ? entity.getIsDeleted().toString() : "false")
                .build();
    }

    private static String toStr(Long v) {
        return v == null ? null : v.toString();
    }

    private static String formatDate(LocalDate d) {
        return d == null ? null : d.toString();
    }

    private static String formatDateTime(LocalDateTime dt) {
        return dt == null ? null : dt.toString();
    }

    private static String formatAmount(BigDecimal a) {
        return a == null ? null : a.stripTrailingZeros().toPlainString();
    }
}
