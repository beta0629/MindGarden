package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.MultiTenantUserService;
import com.coresolution.consultation.service.PublicConsultationPackageService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.TenantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

/**
 * by-subdomain 공개 consultationPackages 검증.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MultiTenantController.getTenantBySubdomain — consultationPackages")
class MultiTenantControllerBySubdomainPackagesTest {

    private static final String SUBDOMAIN = "clinic-a";
    private static final String TENANT_ID = "tenant-clinic-a";

    @Mock
    private MultiTenantUserService multiTenantUserService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private UserService userService;

    @Mock
    private PublicConsultationPackageService publicConsultationPackageService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private MultiTenantController controller;

    @Test
    @DisplayName("활성 CONSULTATION_PACKAGE 를 name/description/price 로 반환한다")
    void bySubdomain_includesConsultationPackages() {
        Tenant tenant = Tenant.builder()
                .tenantId(TENANT_ID)
                .name("클리닉A")
                .subdomain(SUBDOMAIN)
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(SUBDOMAIN)).thenReturn(Optional.of(tenant));
        when(publicConsultationPackageService.buildPublicConsultationPackages(eq(TENANT_ID)))
                .thenReturn(List.of(Map.of(
                        "name", "10회 패키지",
                        "description", "기본 상담 10회",
                        "price", 300000)));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getTenantBySubdomain(SUBDOMAIN);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("found")).isEqualTo(true);

        @SuppressWarnings("unchecked")
        Map<String, Object> tenantMap = (Map<String, Object>) data.get("tenant");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> packages =
                (List<Map<String, Object>>) tenantMap.get("consultationPackages");

        assertThat(packages).hasSize(1);
        assertThat(packages.get(0).get("name")).isEqualTo("10회 패키지");
        assertThat(packages.get(0).get("description")).isEqualTo("기본 상담 10회");
        assertThat(packages.get(0).get("price")).isEqualTo(300000);
    }

    @Test
    @DisplayName("패키지가 없으면 빈 배열을 반환한다")
    void bySubdomain_emptyPackagesWhenNone() {
        Tenant tenant = Tenant.builder()
                .tenantId(TENANT_ID)
                .name("클리닉A")
                .subdomain(SUBDOMAIN)
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(SUBDOMAIN)).thenReturn(Optional.of(tenant));
        when(publicConsultationPackageService.buildPublicConsultationPackages(eq(TENANT_ID)))
                .thenReturn(List.of());

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getTenantBySubdomain(SUBDOMAIN);

        @SuppressWarnings("unchecked")
        Map<String, Object> tenantMap =
                (Map<String, Object>) response.getBody().getData().get("tenant");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> packages =
                (List<Map<String, Object>>) tenantMap.get("consultationPackages");

        assertThat(packages).isEmpty();
    }
}
