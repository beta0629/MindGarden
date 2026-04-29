package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 특이사항 수정 요청(부분 갱신).
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientScheduleNoteUpdateRequest {

    @Size(max = 64)
    private String noteType;

    @Size(max = 300)
    private String title;

    private String body;

    private String promiseDate;

    private BigDecimal amount;

    @Size(max = 10)
    private String currency;
}
