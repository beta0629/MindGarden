package com.coresolution.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 표시명({@code tenants.name}) 변경 요청 DTO.
 *
 * <p>API: {@code PUT /api/v1/tenants/{tenantId}/name}</p>
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantNameUpdateRequest {

    /**
     * 변경할 테넌트명 (선행·후행 공백은 서비스에서 트림).
     */
    @NotBlank(message = "테넌트명은 필수입니다")
    @Size(max = 255, message = "테넌트명은 255자 이하여야 합니다")
    private String name;
}
