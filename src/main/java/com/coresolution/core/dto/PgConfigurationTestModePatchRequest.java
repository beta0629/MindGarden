package com.coresolution.core.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 설정 테스트 모드 전용 PATCH 요청.
 * 전체 PUT 과 달리 승인 상태를 리셋하지 않고 {@code testMode} 만 갱신한다.
 *
 * @author CoreSolution
 * @since 2026-09-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PgConfigurationTestModePatchRequest {

    /**
     * 테스트 모드 여부
     */
    @NotNull(message = "testMode 는 필수입니다")
    private Boolean testMode;
}
