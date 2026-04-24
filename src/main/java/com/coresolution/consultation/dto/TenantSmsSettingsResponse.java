package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 SMS 비시크릿 설정 응답(시크릿 값 없음).
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSmsSettingsResponse {

    private String tenantId;
    private boolean smsEnabled;
    private String provider;
    private String senderNumber;
    private String apiKeyRef;
    private String apiSecretRef;
}
