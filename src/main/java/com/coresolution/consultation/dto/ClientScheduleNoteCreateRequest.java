package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 특이사항 생성 요청. clientId·scheduleId·mappingId 중 최소 1개는 서비스에서 검증.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientScheduleNoteCreateRequest {

    private Long clientId;
    private Long scheduleId;
    private Long mappingId;

    @Size(max = 120)
    private String occurrenceKey;

    @NotBlank
    @Size(max = 64)
    private String noteType;

    @NotBlank
    @Size(max = 300)
    private String title;

    private String body;

    /** ISO-8601 날짜 문자열 (yyyy-MM-dd) */
    private String promiseDate;

    private BigDecimal amount;

    @Size(max = 10)
    private String currency;
}
