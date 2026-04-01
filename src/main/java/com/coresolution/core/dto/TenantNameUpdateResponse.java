package com.coresolution.core.dto;

import com.coresolution.core.domain.Tenant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테넌트 표시명 변경 후 스냅샷 응답 DTO.
 *
 * @author CoreSolution
 * @since 2026-04-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantNameUpdateResponse {

    private String tenantId;
    private String name;
    private String businessType;
    private String status;

    /**
     * 엔티티로부터 응답 DTO를 생성합니다.
     *
     * @param tenant 테넌트 엔티티
     * @return 응답 DTO
     */
    public static TenantNameUpdateResponse fromEntity(Tenant tenant) {
        if (tenant == null) {
            return null;
        }
        return TenantNameUpdateResponse.builder()
                .tenantId(tenant.getTenantId())
                .name(tenant.getName())
                .businessType(tenant.getBusinessType())
                .status(tenant.getStatus() != null ? tenant.getStatus().name() : null)
                .build();
    }
}
