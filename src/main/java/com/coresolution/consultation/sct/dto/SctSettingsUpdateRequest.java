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
    /** 보관 일수(기본 365). 자동 삭제 배치 없음. */
    @Min(1)
    private Integer retentionDays;
    /**
     * true 이면 보관일을 기본값(365)으로 되돌림.
     * null 보관(자동 파기 없음)은 더 이상 허용하지 않음.
     */
    private Boolean clearRetention;
}
