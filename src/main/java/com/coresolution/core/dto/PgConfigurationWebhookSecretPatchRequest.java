package com.coresolution.core.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 설정 포트원 웹훅 시크릿 전용 PATCH 요청.
 * 전체 PUT 과 달리 승인/상태를 리셋하지 않고 settings_json 의
 * {@code portoneWebhookSecret} 만 갱신한다.
 *
 * @author CoreSolution
 * @since 2026-03-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PgConfigurationWebhookSecretPatchRequest {

    /**
     * 포트원 V2 웹훅 시크릿 (평문). 서버에서 암호화 후 저장한다.
     */
    @NotBlank(message = "webhookSecret 는 필수입니다")
    private String webhookSecret;
}
