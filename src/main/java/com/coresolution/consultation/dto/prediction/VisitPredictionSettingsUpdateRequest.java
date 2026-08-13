package com.coresolution.consultation.dto.prediction;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 방문 예측 설정 변경 요청 DTO
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Data
public class VisitPredictionSettingsUpdateRequest {

    @NotNull(message = "예측 활성화 여부는 필수입니다.")
    private Boolean predictionEnabled;
}
