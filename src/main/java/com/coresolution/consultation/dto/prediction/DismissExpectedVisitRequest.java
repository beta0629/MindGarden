package com.coresolution.consultation.dto.prediction;

import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 예상 방문일 1회 무시 요청 DTO
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Data
public class DismissExpectedVisitRequest {

    @NotNull(message = "매핑 ID는 필수입니다.")
    private Long mappingId;

    @NotNull(message = "예상 방문일은 필수입니다.")
    private LocalDate expectedDate;
}
