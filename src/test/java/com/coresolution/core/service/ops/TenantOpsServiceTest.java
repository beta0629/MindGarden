package com.coresolution.core.service.ops;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * TenantOpsService 단위 테스트 — list subdomain · suspend/resume 경계.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantOpsService 단위 테스트")
class TenantOpsServiceTest {

    private static final String TENANT_ID = "tenant-seoul-consultation-001";

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private TenantOpsService tenantOpsService;

    private Tenant activeTenant;

    @BeforeEach
    void setUp() {
        activeTenant = Tenant.builder()
                .tenantId(TENANT_ID)
                .name("마음정원 센터")
                .businessType("CONSULTATION")
                .status(TenantStatus.ACTIVE)
                .subdomain("maeum")
                .build();
    }

    @Test
    @DisplayName("목록에 subdomain 포함")
    void listTenants_includesSubdomain() {
        when(tenantRepository.findAllNotDeletedOrderByName()).thenReturn(List.of(activeTenant));

        List<Map<String, Object>> result = tenantOpsService.listTenants();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("subdomain")).isEqualTo("maeum");
        assertThat(result.get(0).get("name")).isEqualTo("마음정원 센터");
        assertThat(result.get(0).get("status")).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("ACTIVE → SUSPENDED 정지 성공")
    void suspendTenant_fromActive_success() {
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(activeTenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = tenantOpsService.suspendTenant(TENANT_ID);

        assertThat(result.get("status")).isEqualTo("SUSPENDED");
        assertThat(activeTenant.getStatus()).isEqualTo(TenantStatus.SUSPENDED);
        verify(tenantRepository).save(activeTenant);
    }

    @Test
    @DisplayName("PENDING 정지는 거부")
    void suspendTenant_fromPending_throws() {
        activeTenant.setStatus(TenantStatus.PENDING);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(activeTenant));

        assertThatThrownBy(() -> tenantOpsService.suspendTenant(TENANT_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("운영중");
    }

    @Test
    @DisplayName("SUSPENDED → ACTIVE 재개 성공")
    void resumeTenant_fromSuspended_success() {
        activeTenant.setStatus(TenantStatus.SUSPENDED);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(activeTenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = tenantOpsService.resumeTenant(TENANT_ID);

        assertThat(result.get("status")).isEqualTo("ACTIVE");
        assertThat(activeTenant.getStatus()).isEqualTo(TenantStatus.ACTIVE);
    }

    @Test
    @DisplayName("CLOSED 재개는 거부")
    void resumeTenant_fromClosed_throws() {
        activeTenant.setStatus(TenantStatus.CLOSED);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(activeTenant));

        assertThatThrownBy(() -> tenantOpsService.resumeTenant(TENANT_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("정지");
    }
}
