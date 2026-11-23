package com.coresolution.consultation.sct.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 센터 설정 변경(ADMIN).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctSettingsUpdateRequest {
    @Min(1)
    @Max(30)
    private Integer linkExpiryDays;
    /** null 허용 = 자동 파기 없음 */
    @Min(1)
    private Integer retentionDays;
    private Boolean clearRetention;
}
