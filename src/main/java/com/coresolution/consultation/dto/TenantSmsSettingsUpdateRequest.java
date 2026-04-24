package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 SMS 비시크릿 설정 수정 요청(시크릿 본문 금지, 참조 문자열만).
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSmsSettingsUpdateRequest {

    @NotNull
    private Boolean smsEnabled;

    @Size(max = 120)
    private String provider;

    @Size(max = 32)
    private String senderNumber;

    @Size(max = 200)
    private String apiKeyRef;

    @Size(max = 200)
    private String apiSecretRef;
}
