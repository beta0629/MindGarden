package com.coresolution.consultation.util;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계·이관 이력 정규화 중간 객체. 표시용 이름·방향은 서비스에서 채운다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionTransferHistoryDraft {

    private Long id;
    private LocalDateTime occurredAt;
    private Integer sessionCount;
    private Long sourceMappingId;
    private Long targetMappingId;
    private Long sourceClientId;
    private Long targetClientId;
    private Long sourceConsultantId;
    private Long targetConsultantId;
    private String reason;
    private String recordSource;
    private int sourcePriority;
}
