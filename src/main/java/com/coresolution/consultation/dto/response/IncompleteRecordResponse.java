package com.coresolution.consultation.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 미작성 상담일지 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-03-09
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncompleteRecordResponse {
    
    private Long scheduleId;
    private String clientName;
    private LocalDate sessionDate;
    private Long elapsedHours;
    private Integer sessionNumber;
    
    /**
     * 경과 시간 계산 (시간 단위)
     */
    public static Long calculateElapsedHours(LocalDate sessionDate) {
        if (sessionDate == null) {
            return 0L;
        }
        LocalDateTime sessionDateTime = sessionDate.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        return ChronoUnit.HOURS.between(sessionDateTime, now);
    }
}
